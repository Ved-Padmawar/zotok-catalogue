import React, { useState, useCallback } from "react";
import { Rows, Title, Button, Box, Text, ImageBox, ImageCard, TypographyCard, Columns, Column } from "@canva/app-ui-kit";
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
   * Creates a clean draggable field component matching the mockup design
   */
  const DetailField = useCallback(({ label, value, elementKey, icon = null }) => {
    if (!value) return null;

    const isLoading = loadingStates[elementKey];
    const stringValue = String(value);

    return (
      <Rows spacing="1u">
        <Text size="small" color="secondary" style={{ fontWeight: '500' }}>
          {icon && <span className="field-icon">{icon}</span>}
          {label}
        </Text>
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--ui-kit-color-surface)',
            border: '1px solid var(--ui-kit-color-border)',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.15s ease'
          }}
          draggable={!isLoading}
          onClick={() => handleTextAction(stringValue, elementKey)}
          onDragStart={(e) => handleTextAction(stringValue, elementKey, e)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTextAction(stringValue, elementKey);
            }
          }}
          aria-label={`Add ${label} to design: ${stringValue}`}
        >
          <Text size="small" style={{ color: 'var(--ui-kit-color-text-primary)' }}>
            {stringValue}
          </Text>
        </div>
      </Rows>
    );
  }, [loadingStates, handleTextAction]);


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
      {/* Scrollable Content */}
      <div className="detail-content">
        {/* Clean Header - Minimal Back Button and Product Name */}
        <Box style={{ marginTop: '32px', marginBottom: '24px' }}>
          <Rows spacing="3u">
            <div
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                color: 'var(--ui-kit-color-text-secondary)',
                fontSize: '14px',
                fontWeight: '400'
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBack();
                }
              }}
              aria-label="Go back to main view"
            >
              ← {product.productName || 'Product details'}
            </div>
          </Rows>
        </Box>

        {/* Images Section */}
        <Box style={{ marginTop: '60px' }}>
          <Rows spacing="2u">
            <div className="images-grid">
              {hasImages ? (
                images.map((imageUrl, index) => {
                  const key = `image-${index}`;
                  const isLoading = loadingStates[key];
                  const hasError = imageErrors[index];
                  const altText = `${product.productName} - Image ${index + 1}`;

                  if (hasError) {
                    return (
                      <Box key={`image-${index}`}>
                        <Rows spacing="1u" align="center">
                          <Text size="small">🖼️</Text>
                          <Text size="small" color="secondary">Image unavailable</Text>
                        </Rows>
                      </Box>
                    );
                  }

                  return (
                    <ImageCard
                      key={`image-${index}`}
                      thumbnailUrl={imageUrl}
                      alt={altText}
                      ariaLabel={`Add ${altText} to design`}
                      loading={isLoading}
                      onClick={() => handleImageAction(imageUrl, altText, key)}
                      onDragStart={(e) => handleImageAction(imageUrl, altText, key, e)}
                    />
                  );
                })
              ) : (
                <Box>
                  <Rows spacing="2u" align="center">
                    <Text size="small">📦</Text>
                    <Text size="small" color="secondary">No images available</Text>
                  </Rows>
                </Box>
              )}
            </div>
          </Rows>
        </Box>

        {/* Details Section */}
        <Box style={{ marginTop: '32px' }}>
          <Rows spacing="2u">
            <Title size="small">Details</Title>

            {/* WhatsApp Link */}
            {phoneNumber && product.skuCode && (
              <WhatsAppLink
                phoneNumber={phoneNumber}
                skuCode={product.skuCode}
              />
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
              label="Pack size"
              value={product.packSize}
              elementKey="pack-size"
            />

            <DetailField
              label="Base unit"
              value={product.baseUnit}
              elementKey="base-unit"
            />

            <DetailField
              label="Gross weight"
              value={product.grossWeight}
              elementKey="gross-weight"
            />

            <DetailField
              label="Net weight"
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
              label="Tax category"
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
              label="Case size"
              value={product.caseSize}
              elementKey="case-size"
            />

            <DetailField
              label="Min order quantity"
              value={product.minOrderQuantity}
              elementKey="min-order-qty"
            />

            <DetailField
              label="Max order quantity"
              value={product.maxOrderQuantity}
              elementKey="max-order-qty"
            />

            <DetailField
              label="Quantity multiplier"
              value={product.quantityMultiplier}
              elementKey="qty-multiplier"
            />

            <DetailField
              label="Display order"
              value={product.displayOrder}
              elementKey="display-order"
            />

            <DetailField
              label="CFA names"
              value={Array.isArray(product.cfaNames) ? product.cfaNames.join(', ') : product.cfaNames}
              elementKey="cfa-names"
            />
          </Rows>
        </Box>


        {/* Drag and Drop Help */}
        <Box>
          <Rows spacing="1u">
            <Text size="small" color="secondary">
              <strong>💡 Tip:</strong> Click any field or image to add it to your design, or drag it directly onto your canvas.
              {!features.canDragToPoint && !features.canDragToCursor &&
                " Drag and drop may not be available in all design types."
              }
            </Text>
          </Rows>
        </Box>
      </div>
    </div>
  );
}