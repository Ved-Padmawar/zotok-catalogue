import React, { useState, useCallback } from "react";
import { useDragDrop } from "../hooks/useDragDrop.jsx";
import { CURRENCY } from "../utils/constants.jsx";
import WhatsAppLink from "./WhatsAppLink.jsx";

/**
 * Enhanced Product Detail Component with new UI design
 * @param {Object} props - Component props
 * @param {Object} props.product - Product data
 * @param {Function} props.onBack - Back navigation handler
 * @param {string} props.authToken - Authentication token
 * @param {Function} props.onTokenExpired - Token expiry handler
 * @param {string} props.phoneNumber - User's phone number for WhatsApp links
 */
export default function ProductDetail({ 
  product, 
  onBack, 
  authToken, 
  onTokenExpired,
  phoneNumber = ''
}) {
  const [loadingStates, setLoadingStates] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  
  const { 
    handleTextElement, 
    handleImageElement, 
    handleProductClick,
    getAvailableFeatures 
  } = useDragDrop();

  const features = getAvailableFeatures();

  /**
   * Formats price with currency symbol
   */
  const formatPrice = useCallback((price) => {
    if (!price || isNaN(price)) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${CURRENCY.SYMBOL}${numPrice.toFixed(CURRENCY.DECIMAL_PLACES)}`;
  }, []);

  /**
   * Gets all product images as array with fallback handling
   */
  const getProductImages = useCallback(() => {
    if (!product.productImages) return [];
    
    if (typeof product.productImages === 'string') {
      return product.productImages.split(',').map(url => url.trim()).filter(url => url);
    } else if (Array.isArray(product.productImages)) {
      return product.productImages.filter(url => url);
    }
    return [];
  }, [product.productImages]);

  /**
   * Sets loading state for specific element
   */
  const setElementLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  /**
   * Handles image loading errors
   */
  const handleImageError = useCallback((index) => {
    setImageErrors(prev => ({
      ...prev,
      [index]: true
    }));
  }, []);

  /**
   * Generic handler for text elements
   */
  const handleTextAction = useCallback(async (text, key, event = null) => {
    try {
      setElementLoading(key, true);
      await handleTextElement(text, event);
    } catch (error) {
      console.error(`Failed to add text element: ${key}`, error);
    } finally {
      setElementLoading(key, false);
    }
  }, [handleTextElement, setElementLoading]);

  /**
   * Enhanced image action handler with better error handling
   */
  const handleImageAction = useCallback(async (imageUrl, altText, key, event = null) => {
    try {
      setElementLoading(key, true);
      await handleImageElement(imageUrl, altText, event);
    } catch (error) {
      console.error(`Failed to add image element: ${key}`, error);
      alert('Failed to add image. The image might not be accessible or there may be a connection issue.');
    } finally {
      setElementLoading(key, false);
    }
  }, [handleImageElement, setElementLoading]);

  /**
   * Handles adding entire product to design
   */
  const handleAddProductToDesign = useCallback(async () => {
    try {
      setElementLoading('product', true);
      await handleProductClick(product);
    } catch (error) {
      console.error('Failed to add product to design:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setElementLoading('product', false);
    }
  }, [handleProductClick, product]);

  /**
   * Creates a draggable field component with new design
   */
  const DetailField = useCallback(({ label, value, elementKey, icon = null }) => {
    if (!value) return null;

    const isLoading = loadingStates[elementKey];
    const stringValue = String(value);

    return (
      <div className="detail-field">
        <div className="detail-field-label">
          {icon && <span className="field-icon">{icon}</span>}
          {label}
        </div>
        <div 
          className={`detail-field-value ${isLoading ? 'loading' : ''}`}
          draggable={!isLoading}
          onDragStart={(e) => handleTextAction(stringValue, elementKey, e)}
          onClick={() => handleTextAction(stringValue, elementKey)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTextAction(stringValue, elementKey);
            }
          }}
          aria-label={`Add ${label} to design: ${stringValue}`}
          title={`Click or drag to add "${stringValue}" to your design`}
        >
          {stringValue}
        </div>
      </div>
    );
  }, [loadingStates, handleTextAction]);

  /**
   * Creates a draggable image component with enhanced error handling
   */
  const DetailImage = useCallback(({ imageUrl, altText, index }) => {
    const key = `image-${index}`;
    const isLoading = loadingStates[key];
    const hasError = imageErrors[index];

    if (hasError) {
      return (
        <div className="detail-image error">
          <div className="image-error-content">
            <span className="image-error-icon">🖼️</span>
            <span className="image-error-text">Image unavailable</span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`detail-image ${isLoading ? 'loading' : ''}`}
        draggable={!isLoading}
        onDragStart={(e) => handleImageAction(imageUrl, altText, key, e)}
        onClick={() => handleImageAction(imageUrl, altText, key)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleImageAction(imageUrl, altText, key);
          }
        }}
        aria-label={`Add ${altText} to design`}
        title="Click or drag to add this image to your design"
      >
        <img
          src={imageUrl}
          alt={altText}
          loading="lazy"
          onError={() => handleImageError(index)}
        />
        {isLoading && (
          <div className="image-loading-overlay">
            <div className="loading-spinner small" />
          </div>
        )}
      </div>
    );
  }, [loadingStates, imageErrors, handleImageAction, handleImageError]);

  /**
   * Product image placeholder component
   */
  const ImagePlaceholder = useCallback(() => (
    <div className="image-placeholder">
      <div className="image-placeholder-content">
        <div className="image-placeholder-icon">📦</div>
        <div className="image-placeholder-text">No images available</div>
      </div>
    </div>
  ), []);

  const images = getProductImages();
  const hasImages = images.length > 0;

  return (
    <div className="detail-view-container">
      {/* Header with back button and title */}
      <div className="detail-header">
        <button 
          className="detail-back-btn" 
          onClick={onBack} 
          aria-label="Go back to main view"
          title="Back"
        >
          ←
        </button>
        <div className="detail-header-title">
          {product.productName || 'Product Details'}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="detail-content">
        {/* Images Section */}
        <div className="detail-section">
          <h3 className="section-heading">Images</h3>
          <div className="images-grid">
            {hasImages ? (
              images.map((imageUrl, index) => (
                <DetailImage
                  key={`image-${index}`}
                  imageUrl={imageUrl}
                  altText={`${product.productName} - Image ${index + 1}`}
                  index={index}
                />
              ))
            ) : (
              <ImagePlaceholder />
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="detail-section">
          <h3 className="section-heading">Details</h3>
          <div className="details-grid">
            
            {/* WhatsApp Link */}
            {phoneNumber && product.skuCode && (
              <div className="detail-field">
                <WhatsAppLink 
                  phoneNumber={phoneNumber}
                  skuCode={product.skuCode}
                />
              </div>
            )}
            
            {/* Basic Information */}
            <DetailField
              label="Title"
              value={product.productName}
              elementKey="product-name"
            />

            <DetailField
              label="Category"
              value={product.categoryName}
              elementKey="category"
            />

            <DetailField
              label="SKU"
              value={product.skuCode}
              elementKey="sku-code"
            />

            {/* Pricing */}
            {product.price && (
              <DetailField
                label="Price"
                value={formatPrice(product.price)}
                elementKey="price"
              />
            )}

            {product.mrp && (
              <DetailField
                label="MRP"
                value={formatPrice(product.mrp)}
                elementKey="mrp"
              />
            )}

            {product.ptr && (
              <DetailField
                label="PTR"
                value={formatPrice(product.ptr)}
                elementKey="ptr"
              />
            )}

            {/* Specifications */}
            <DetailField
              label="Pack Size"
              value={product.packSize}
              elementKey="pack-size"
            />

            <DetailField
              label="Base Unit"
              value={product.baseUnit}
              elementKey="base-unit"
            />

            <DetailField
              label="Gross Weight"
              value={product.grossWeight}
              elementKey="gross-weight"
            />

            <DetailField
              label="Net Weight"
              value={product.netWeight}
              elementKey="net-weight"
            />

            {/* Additional Information */}
            <DetailField
              label="Division"
              value={Array.isArray(product.divisionNames) ? product.divisionNames.join(', ') : product.divisionNames}
              elementKey="division"
            />

            <DetailField
              label="Tax Category"
              value={product.taxCategory}
              elementKey="tax-category"
            />

            {product.isEnabled !== undefined && (
              <DetailField
                label="Status"
                value={product.isEnabled !== false ? "Active" : "Inactive"}
                elementKey="status"
              />
            )}

            {/* Order Information */}
            <DetailField
              label="Case Size"
              value={product.caseSize}
              elementKey="case-size"
            />

            <DetailField
              label="Min Order Quantity"
              value={product.minOrderQuantity}
              elementKey="min-order-qty"
            />

            <DetailField
              label="Max Order Quantity"
              value={product.maxOrderQuantity}
              elementKey="max-order-qty"
            />

            <DetailField
              label="Quantity Multiplier"
              value={product.quantityMultiplier}
              elementKey="qty-multiplier"
            />

            <DetailField
              label="Display Order"
              value={product.displayOrder}
              elementKey="display-order"
            />

            <DetailField
              label="CFA Names"
              value={Array.isArray(product.cfaNames) ? product.cfaNames.join(', ') : product.cfaNames}
              elementKey="cfa-names"
            />
          </div>
        </div>


        {/* Drag and Drop Help */}
        <div className="detail-section">
          <div className="help-section">
            <div className="help-content">
              <strong>💡 Tip:</strong> Click any field or image to add it to your design, or drag it directly onto your canvas.
              {!features.canDragToPoint && !features.canDragToCursor && 
                " Drag and drop may not be available in all design types."
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}