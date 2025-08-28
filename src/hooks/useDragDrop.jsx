import { useCallback } from 'react';
import { ui, addElementAtPoint, addElementAtCursor } from '@canva/design';
import { upload } from '@canva/asset';
import { useFeatureSupport } from '../../utils/use_feature_support';
import { getBestProductImage } from '../utils/svgFallback.jsx';
import {
  DRAG_CONFIG,
  DESIGN_CONFIG,
  ERROR_MESSAGES,
  CONTENT_SUPPORT
} from '../utils/constants.jsx';

/**
 * Enhanced drag and drop hook preserving all existing functionality
 * while supporting the new UI design
 */
export function useDragDrop() {
  const isSupported = useFeatureSupport();

  const canDragToPoint = isSupported(ui.startDragToPoint);
  const canDragToCursor = isSupported(ui.startDragToCursor);
  const canAddAtPoint = isSupported(addElementAtPoint);
  const canAddAtCursor = isSupported(addElementAtCursor);

const makeCorsCompatibleUrl = useCallback((imageUrl) => {
  // Just return the original URL - Zotok images are publicly accessible
  if (!imageUrl || typeof imageUrl !== 'string') return imageUrl;
  
  console.log('🔍 Original URL received:', imageUrl);
  console.log('🔍 URL length:', imageUrl.length);
  console.log('🔍 URL ends with:', imageUrl.slice(-10));
  console.log('🔍 URL contains %27:', imageUrl.includes('%27'));
  console.log('🔍 URL contains single quote:', imageUrl.includes("'"));
  
  return imageUrl;
}, []);

  const uploadImageSafely = useCallback(async (imageUrl, altText) => {
  console.log('🔄 Starting upload for:', imageUrl);
  console.log('🔄 Alt text:', altText);
  console.log('🔄 Image URL type:', typeof imageUrl);
  console.log('🔄 Image URL length:', imageUrl?.length);
  
  if (!imageUrl || typeof imageUrl !== 'string') {
    console.error('❌ Invalid image URL passed to uploadImageSafely:', imageUrl);
    throw new Error('Invalid image URL for upload');
  }

  const corsUrl = makeCorsCompatibleUrl(imageUrl);
  if (!corsUrl || typeof corsUrl !== 'string') {
    console.error('❌ CORS URL generation failed');
    throw new Error('CORS image URL generation failed');
  }

  console.log('🔄 Using CORS URL:', corsUrl);
  console.log('🔄 Original vs CORS URL same?', imageUrl === corsUrl);

  // Detect MIME type from URL
  let mimeType = 'image/jpeg';
  const urlLower = corsUrl.toLowerCase();
  if (urlLower.includes('.png')) mimeType = 'image/png';
  else if (urlLower.includes('.webp')) mimeType = 'image/webp';
  else if (urlLower.includes('.gif')) mimeType = 'image/gif';
  else if (urlLower.includes('.svg')) mimeType = 'image/svg+xml';

  console.log('🔄 Detected MIME type:', mimeType);
  console.log('🔄 Image dimensions:', DRAG_CONFIG.IMAGE_FULL_SIZE);

  try {
    console.log('🔄 Calling Canva upload API...');
    
    const uploadParams = {
      type: 'image',
      url: corsUrl,
      thumbnailUrl: corsUrl,
      mimeType,
      width: DRAG_CONFIG.IMAGE_FULL_SIZE.width,
      height: DRAG_CONFIG.IMAGE_FULL_SIZE.height,
      altText: { text: altText, decorative: false },
      aiDisclosure: 'none',
    };
    
    console.log('🔄 Upload parameters:', uploadParams);
    
    const uploadResult = await upload(uploadParams);
    
    console.log('✅ Upload successful!');
    console.log('✅ Upload result:', uploadResult);
    console.log('✅ Upload result type:', typeof uploadResult);
    console.log('✅ Upload result keys:', Object.keys(uploadResult || {}));
    
    return uploadResult;
    
  } catch (error) {
    console.error('❌ Upload failed with error:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error object:', error);
    
    // Additional error details
    if (error.response) {
      console.error('❌ Error response:', error.response);
    }
    if (error.request) {
      console.error('❌ Error request:', error.request);
    }
    
    // Log the URL that failed
    console.error('❌ Failed URL:', corsUrl);
    console.error('❌ Original URL:', imageUrl);
    console.error('❌ MIME type used:', mimeType);
    
    throw new Error(`Image upload failed: ${error.message || 'Unknown error'}`);
  }
}, [makeCorsCompatibleUrl]);

  const handleProductDrag = useCallback(async (event, product) => {
    try {
      event.preventDefault();

      console.log('Starting product drag for:', product.productName);
      console.log('Product images:', product.productImages);

      let imageUrl = await getBestProductImage(product.productImages, product.productName);
      if (!imageUrl) {
        console.warn('No valid image found. Using SVG fallback.');
        imageUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><text x="10" y="100" font-size="20" fill="black">No Image</text></svg>`;
      }

      console.log('Image URL to use:', imageUrl);
      const isSvgFallback = imageUrl.startsWith('data:image/svg+xml');
      console.log('Is SVG fallback:', isSvgFallback);

      if (isSvgFallback) {
        console.log('Using text drag for SVG fallback');
        await handleTextDrag(event, product);
      } else {
        console.log('Using image drag for real image');
        await handleImageDrag(event, product, imageUrl);
      }
    } catch (error) {
      console.error('Product drag failed:', error);
      console.error('Error details:', {
        productName: product.productName,
        hasImages: !!product.productImages,
        error: error.message || error
      });
      try {
        console.log('Falling back to text drag');
        await handleTextDrag(event, product);
      } catch (fallbackError) {
        console.error('Fallback text drag also failed:', fallbackError);
        throw new Error(ERROR_MESSAGES.DRAG_FAILED);
      }
    }
  }, [handleTextDrag, handleImageDrag]);

  const handleImageDrag = useCallback(async (event, product, imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.warn('Skipping image drag: invalid imageUrl', imageUrl);
      return;
    }

    const altText = `${DESIGN_CONFIG.ALT_TEXT_PREFIX}${product.productName}`;
    const corsUrl = makeCorsCompatibleUrl(imageUrl);

    console.log('Starting image drag with URL:', corsUrl);

    const dragData = {
      type: 'image',
      resolveImageRef: async () => {
        try {
          console.log('Attempting to upload image:', corsUrl);
          const result = await uploadImageSafely(corsUrl, altText);
          console.log('Image upload successful:', result);
          return result;
        } catch (error) {
          console.error('Image upload failed during drag:', error);
          throw error;
        }
      },
      previewUrl: corsUrl,
      previewSize: DRAG_CONFIG.IMAGE_PREVIEW_SIZE,
      fullSize: DRAG_CONFIG.IMAGE_FULL_SIZE,
    };

    try {
      if (canDragToPoint && CONTENT_SUPPORT.startDragToPoint.includes('image')) {
        console.log('Using startDragToPoint for image');
        ui.startDragToPoint(event, dragData);
      } else if (canDragToCursor && CONTENT_SUPPORT.startDragToCursor.includes('image')) {
        console.log('Using startDragToCursor for image');
        ui.startDragToCursor(event, dragData);
      } else {
        throw new Error('No compatible drag method available for images');
      }
    } catch (error) {
      console.error('Failed to start image drag:', error);
      throw error;
    }
  }, [canDragToPoint, canDragToCursor, makeCorsCompatibleUrl, uploadImageSafely]);

  const handleTextDrag = useCallback(async (event, product) => {
    const productText = createProductText(product);
    if (!productText || typeof productText !== 'string') {
      throw new Error('Invalid product text for dragging');
    }

    const dragData = {
      type: 'text',
      children: [productText],
    };

    if (canDragToPoint && CONTENT_SUPPORT.startDragToPoint.includes('text')) {
      ui.startDragToPoint(event, dragData);
    } else {
      throw new Error('No compatible drag method available for text');
    }
  }, [canDragToPoint]);

  const handleProductClick = useCallback(async (product) => {
    try {
      let imageUrl = await getBestProductImage(product.productImages, product.productName);
      if (!imageUrl) {
        console.warn('No valid image found. Using SVG fallback.');
        imageUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><text x="10" y="100" font-size="20" fill="black">No Image</text></svg>`;
      }

      const isSvgFallback = imageUrl.startsWith('data:image/svg+xml');

      if (isSvgFallback) {
        const productText = createProductText(product);
        if (!productText || typeof productText !== 'string') {
          throw new Error('Invalid product text for click');
        }

        const textElement = { type: 'text', children: [productText] };
        if (canAddAtPoint) {
          await addElementAtPoint(textElement);
        } else if (canAddAtCursor) {
          await addElementAtCursor(textElement);
        } else {
          throw new Error('No add method available for text');
        }
      } else {
        const altText = `${DESIGN_CONFIG.ALT_TEXT_PREFIX}${product.productName}`;
        const asset = await uploadImageSafely(imageUrl, altText);
        const imageElement = { type: 'image', ref: asset.ref };
        if (canAddAtPoint) {
          await addElementAtPoint(imageElement);
        } else if (canAddAtCursor) {
          await addElementAtCursor(imageElement);
        } else {
          throw new Error('No add method available for images');
        }
      }
    } catch (error) {
      console.error('Error adding product to design:', error);
      // Check if it's a container error and provide a more helpful message
      if (error.message && (error.message.includes('container') || error.message.includes('fixed-page'))) {
        throw new Error('Cannot add element to this design type. Please try a different design or use a different canvas type.');
      }
      throw error;
    }
  }, [canAddAtPoint, canAddAtCursor, uploadImageSafely]);

  const handleTextElement = useCallback(async (text, event = null) => {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.error('Invalid text passed to handleTextElement:', text);
      throw new Error('Invalid text content');
    }

    const textData = { type: 'text', children: [text] };

    try {
      if (event) {
        if (canDragToPoint) {
          ui.startDragToPoint(event, textData);
        } else {
          throw new Error('Drag not supported for text');
        }
      } else {
        if (canAddAtPoint) {
          await addElementAtPoint(textData);
        } else if (canAddAtCursor) {
          await addElementAtCursor(textData);
        } else {
          throw new Error('No add method available for text');
        }
      }
    } catch (error) {
      console.error('Error adding text element:', error);
      // Check if it's a container error and provide a more helpful message
      if (error.message && (error.message.includes('container') || error.message.includes('fixed-page'))) {
        throw new Error('Cannot add text element to this design type. Please try a different design or use a different canvas type.');
      }
      throw error;
    }
  }, [canDragToPoint, canAddAtPoint, canAddAtCursor]);

  const handleImageElement = useCallback(async (imageUrl, altText, event = null) => {
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL for image element');
    }

    const corsUrl = makeCorsCompatibleUrl(imageUrl);
    console.log('handleImageElement called with:', { imageUrl, corsUrl, altText, hasEvent: !!event });

    try {
      if (event) {
        const imageData = {
          type: 'image',
          resolveImageRef: async () => {
            console.log('resolveImageRef called for image element');
            return await uploadImageSafely(corsUrl, altText);
          },
          previewUrl: corsUrl,
          previewSize: DRAG_CONFIG.IMAGE_PREVIEW_SIZE,
          fullSize: DRAG_CONFIG.IMAGE_FULL_SIZE,
        };

        console.log('Starting image element drag with data:', imageData);

        if (canDragToPoint) {
          console.log('Using startDragToPoint for image element');
          ui.startDragToPoint(event, imageData);
        } else if (canDragToCursor) {
          console.log('Using startDragToCursor for image element');
          ui.startDragToCursor(event, imageData);
        } else {
          throw new Error('Drag not supported for images');
        }
      } else {
        console.log('Adding image element directly (no drag)');
        const asset = await uploadImageSafely(corsUrl, altText);
        const imageElement = { type: 'image', ref: asset.ref };
        if (canAddAtPoint) {
          await addElementAtPoint(imageElement);
        } else if (canAddAtCursor) {
          await addElementAtCursor(imageElement);
        } else {
          throw new Error('No add method available for images');
        }
      }
    } catch (error) {
      console.error('Error adding image element:', error);
      // Check if it's a container error and provide a more helpful message
      if (error.message && (error.message.includes('container') || error.message.includes('fixed-page'))) {
        throw new Error('Cannot add image element to this design type. Please try a different design or use a different canvas type.');
      }
      throw error;
    }
  }, [canDragToPoint, canDragToCursor, canAddAtPoint, canAddAtCursor, makeCorsCompatibleUrl, uploadImageSafely]);

  const getAvailableFeatures = useCallback(() => ({
    canDragToPoint,
    canDragToCursor,
    canAddAtPoint,
    canAddAtCursor,
    supportedDragTypes: {
      text: canDragToPoint,
      image: canDragToPoint || canDragToCursor,
      video: canDragToPoint || canDragToCursor,
      audio: canDragToPoint,
      embed: canDragToPoint || canDragToCursor
    }
  }), [canDragToPoint, canDragToCursor, canAddAtPoint, canAddAtCursor]);

  return {
    handleProductDrag,
    handleProductClick,
    handleTextElement,
    handleImageElement,
    canDragToPoint,
    canDragToCursor,
    canAddAtPoint,
    canAddAtCursor,
    getAvailableFeatures
  };
}

/**
 * Creates text representation of product for drag and drop
 * @param {Object} product - Product data
 * @returns {string} Product text
 */
function createProductText(product) {
  const parts = [];

  if (typeof product.productName === 'string' && product.productName.trim()) {
    parts.push(product.productName.trim());
  }

  if (product.skuCode) {
    parts.push(`SKU: ${String(product.skuCode)}`);
  }

  if (product.price) {
    parts.push(`₹${Number(product.price).toFixed(2)}`);
  } else if (product.mrp) {
    parts.push(`₹${Number(product.mrp).toFixed(2)}`);
  }

  if (product.categoryName) {
    parts.push(String(product.categoryName));
  }

  return parts.join(' • ') || 'Product';
}

export default useDragDrop;