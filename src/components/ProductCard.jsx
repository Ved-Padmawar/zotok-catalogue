import React, { useState, useCallback } from "react";
import { Text } from "@canva/app-ui-kit";
import { useDragDrop } from "../hooks/useDragDrop.jsx";
import { CURRENCY } from "../utils/constants.jsx";
import "../styles/modern-components.css";

/**
 * Minimalist Product Card Component with clean drag and drop functionality
 * @param {Object} props - Component props
 * @param {Object} props.product - Product data
 * @param {Function} props.onClick - Click handler
 * @param {string} props.phoneNumber - User's phone number for WhatsApp links
 */
export default function ProductCard({ product, onClick, phoneNumber = '' }) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { 
    handleProductDrag, 
    handleProductClick,
    handleProductImageWhatsAppDrag,
    handleProductNameWhatsAppDrag
  } = useDragDrop(phoneNumber);

  /**
   * Formats price with currency symbol
   * @param {string|number} price - Price value
   * @returns {string} Formatted price
   */
  const formatPrice = useCallback((price) => {
    if (!price || isNaN(price)) return null;
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${CURRENCY.SYMBOL}${numPrice.toFixed(CURRENCY.DECIMAL_PLACES)}`;
  }, []);

  /**
   * Gets the primary product image URL
   * @returns {string|null} Image URL or null
   */
  const getProductImage = useCallback(() => {
    if (!product.productImages) return null;
    
    // Analyzing product images
    
    if (typeof product.productImages === 'string') {
      const urls = product.productImages.split(',').map(url => url.trim());
      // URLs parsed from string
      return urls[0] || null;
    } else if (Array.isArray(product.productImages)) {
      // Using array URLs
      return product.productImages[0] || null;
    }
    
    return null;
  }, [product.productImages]);

  /**
   * Handles image loading errors
   */
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  /**
   * Handles drag start event for the entire card
   * @param {React.DragEvent} event - Drag event
   */
  const handleDragStart = useCallback(async (event) => {
    try {
      setIsLoading(true);
      await handleProductDrag(event, product);
    } catch (error) {
      console.error('Drag operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [handleProductDrag, product]);

  /**
   * Handles drag start event specifically for product image
   * @param {React.DragEvent} event - Drag event
   */
  const handleImageDragStart = useCallback(async (event) => {
    try {
      event.stopPropagation(); // Prevent card drag
      setIsLoading(true);
      await handleProductImageWhatsAppDrag(event, product);
    } catch (error) {
      console.error('Image drag operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [handleProductImageWhatsAppDrag, product]);

  /**
   * Handles drag start event specifically for product name
   * @param {React.DragEvent} event - Drag event
   */
  const handleNameDragStart = useCallback(async (event) => {
    try {
      event.stopPropagation(); // Prevent card drag
      setIsLoading(true);
      await handleProductNameWhatsAppDrag(event, product);
    } catch (error) {
      console.error('Name drag operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [handleProductNameWhatsAppDrag, product]);

  /**
   * Handles click event for detail view
   * @param {React.MouseEvent} event - Click event
   */
  const handleCardClick = useCallback((event) => {
    // Allow drag to take precedence over click when dragging
    if (isLoading) return;
    onClick();
  }, [onClick, isLoading]);

  /**
   * Handles keyboard events for accessibility
   * @param {React.KeyboardEvent} event - Keyboard event
   */
  const handleKeyDown = useCallback(async (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      
      // Ctrl/Cmd + Enter/Space = Add to design
      if (event.ctrlKey || event.metaKey) {
        try {
          setIsLoading(true);
          await handleProductClick(product);
        } catch (error) {
          console.error('Add to design failed:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Regular Enter/Space = View details
        onClick();
      }
    }
  }, [onClick, handleProductClick, product]);

  const imageUrl = getProductImage();
  const price = formatPrice(product.price);
  const isInactive = product.isEnabled === false;

  return (
    <div 
      className={`product-item ${isLoading ? 'loading' : ''}`}
      onClick={handleCardClick}
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      draggable={!isLoading}
      tabIndex={0}
      role="button"
      aria-label={`${product.productName || 'Product'}. ${price ? `Price: ${price}. ` : ''}Click to view details, Ctrl+Click to add to design`}
    >
      {/* Product Image */}
      <div 
        className="product-thumbnail"
        draggable={!isLoading}
        onDragStart={handleImageDragStart}
        title={phoneNumber ? "Drag to insert WhatsApp link" : "Drag to insert image"}
      >
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={product.productName || 'Product'}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="product-placeholder">
            {product.productName ? product.productName.charAt(0).toUpperCase() : '?'}
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="product-info">
        {/* Product Name */}
        <div 
          className="product-name"
          draggable={!isLoading}
          onDragStart={handleNameDragStart}
          title={phoneNumber ? "Drag to insert WhatsApp link" : "Drag to insert text"}
        >
          {product.productName || 'Unnamed Product'}
          {isInactive && (
            <Text 
              size="xsmall" 
              tone="critical" 
              style={{ marginLeft: 'var(--space-2)', fontWeight: 'var(--font-weight-medium)' }}
            >
              Inactive
            </Text>
          )}
        </div>

        {/* Product Metadata */}
        <div className="product-meta">
          {product.skuCode && (
            <div className="product-sku">
              SKU: {product.skuCode}
            </div>
          )}
          
          {product.categoryName && (
            <div className="product-category">
              {product.categoryName}
            </div>
          )}
        </div>

        {/* Pricing Information */}
        {price && (
          <div className="product-price">
            {price}
            {product.mrp && Number(product.mrp) > Number(product.price) && (
              <Text 
                size="xsmall" 
                tone="tertiary" 
                style={{ 
                  marginLeft: 'var(--space-2)', 
                  textDecoration: 'line-through' 
                }}
              >
                {formatPrice(product.mrp)}
              </Text>
            )}
          </div>
        )}
      </div>

      {/* Loading State Overlay */}
      {isLoading && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-overlay)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            backdropFilter: 'blur(2px)'
          }}
        >
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
}

// Additional CSS for enhanced styling
const additionalStyles = `
  .product-item {
    position: relative;
    cursor: pointer;
    transition: var(--transition-fast);
  }

  .product-item:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .product-item:active {
    transform: translateY(0);
  }

  .product-item.loading {
    pointer-events: none;
  }

  .product-item:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }

  .product-item[draggable="true"] {
    cursor: grab;
  }

  .product-item[draggable="true"]:active {
    cursor: grabbing;
  }

  .product-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-lg);
  }

  @media (max-width: 480px) {
    .product-item {
      gap: var(--space-2);
      padding: var(--space-3);
    }
    
    .product-thumbnail {
      width: 48px;
      height: 48px;
    }
  }

  /* Accessibility improvements */
  @media (prefers-reduced-motion: reduce) {
    .product-item:hover {
      transform: none;
    }
  }
`;

// Inject additional styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('product-card-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'product-card-styles';
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
  }
}