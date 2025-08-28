import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box } from '@canva/app-ui-kit';
import { getBestProductImage, createImageErrorHandler } from '../utils/svgFallback';
import { IMAGE_CONFIG } from '../utils/constants';
import "../styles/modern-components.css";

/**
 * Modern Image component with automatic fallback and lazy loading
 * @param {Object} props - Component props
 * @param {Array<string>} props.images - Array of image URLs
 * @param {string} props.productName - Product name for fallback
 * @param {string} props.alt - Alt text
 * @param {number|string} props.width - Image width
 * @param {number|string} props.height - Image height
 * @param {string} props.borderRadius - Border radius variant
 * @param {Function} props.onLoad - Load callback
 * @param {Function} props.onError - Error callback
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 * @param {boolean} props.lazy - Enable lazy loading
 * @param {string} props.placeholder - Placeholder variant
 */
export function ImageFallback({
  images,
  productName,
  alt,
  width = '100%',
  height = '120px',
  borderRadius = 'small',
  onLoad,
  onError,
  className = '',
  style = {},
  lazy = true,
  placeholder = 'gradient'
}) {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: `${IMAGE_CONFIG.LAZY_LOAD_THRESHOLD}px`
      }
    );

    observerRef.current = observer;

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy]);

  // Load best available image
  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!isVisible) return;

      try {
        setIsLoading(true);
        setHasError(false);
        
        const bestImage = await getBestProductImage(images, productName);
        
        if (isMounted) {
          setImageSrc(bestImage);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load product image:', error);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [images, productName, isVisible]);

  const handleImageLoad = useCallback(() => {
    setHasError(false);
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback((event) => {
    setHasError(true);
    setIsLoading(false);
    onError?.(event);
    
    // Create error handler for fallback
    const errorHandler = createImageErrorHandler(productName);
    errorHandler(event);
  }, [onError, productName]);

  const getPlaceholder = useCallback(() => {
    const dimensions = {
      width: typeof width === 'string' ? width : `${width}px`,
      height: typeof height === 'string' ? height : `${height}px`
    };

    const radiusMap = {
      none: '0',
      small: 'var(--radius-sm)',
      standard: 'var(--radius-md)',
      large: 'var(--radius-lg)'
    };

    const baseStyles = {
      ...dimensions,
      borderRadius: radiusMap[borderRadius] || radiusMap.small,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative'
    };

    switch (placeholder) {
      case 'skeleton':
        return (
          <div 
            style={{
              ...baseStyles,
              background: 'var(--bg-tertiary)',
              animation: 'skeletonPulse 1.5s ease-in-out infinite'
            }}
            className={`image-placeholder skeleton ${className}`}
          />
        );
        
      case 'gradient':
        return (
          <div 
            style={{
              ...baseStyles,
              background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)',
            }}
            className={`image-placeholder gradient ${className}`}
          >
            <span style={{
              color: 'var(--text-tertiary)',
              fontSize: 'var(--text-xs)',
              fontWeight: '500'
            }}>
              {productName ? productName.charAt(0).toUpperCase() : '📦'}
            </span>
          </div>
        );
        
      case 'icon':
        return (
          <div 
            style={{
              ...baseStyles,
              background: 'var(--bg-tertiary)',
              color: 'var(--text-tertiary)'
            }}
            className={`image-placeholder icon ${className}`}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="currentColor"
              style={{ opacity: 0.5 }}
            >
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        );
        
      default:
        return (
          <div 
            style={{
              ...baseStyles,
              background: 'var(--bg-tertiary)'
            }}
            className={`image-placeholder default ${className}`}
          />
        );
    }
  }, [width, height, borderRadius, placeholder, productName, className]);

  // Show placeholder while loading or not visible
  if (isLoading || !isVisible) {
    return (
      <div ref={imgRef} style={style}>
        {getPlaceholder()}
      </div>
    );
  }

  const radiusMap = {
    none: '0',
    small: 'var(--radius-sm)',
    standard: 'var(--radius-md)',
    large: 'var(--radius-lg)'
  };

  return (
    <div ref={imgRef} style={style} className="image-container">
      <img
        src={imageSrc}
        alt={alt || `${productName || 'Product'} image`}
        width={width}
        height={height}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`product-image ${className}`}
        style={{
          objectFit: 'cover',
          borderRadius: radiusMap[borderRadius] || radiusMap.small,
          transition: 'var(--transition-fast)',
          ...style
        }}
        loading={lazy ? 'lazy' : 'eager'}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="image-loading-overlay">
          <div className="loading-spinner loading-small">
            <div className="spinner" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Specialized component for product thumbnails
 * @param {Object} props - Component props
 * @param {Object} props.product - Product object
 * @param {number} props.size - Thumbnail size
 */
export function ProductThumbnail({
  product,
  size = 120,
  ...props
}) {
  return (
    <ImageFallback
      images={product.productImages}
      productName={product.productName}
      width={size}
      height={size}
      borderRadius="standard"
      placeholder="gradient"
      {...props}
    />
  );
}

/**
 * Large product image for detail view
 * @param {Object} props - Component props
 * @param {Object} props.product - Product object
 */
export function ProductDetailImage({
  product,
  ...props
}) {
  return (
    <ImageFallback
      images={product.productImages}
      productName={product.productName}
      width="100%"
      height="200px"
      borderRadius="standard"
      placeholder="skeleton"
      {...props}
    />
  );
}

/**
 * Avatar component for user profiles
 * @param {Object} props - Component props
 * @param {string} props.src - Image source
 * @param {string} props.name - User name
 * @param {number} props.size - Avatar size
 */
export function Avatar({ 
  src, 
  name = '', 
  size = 40,
  ...props 
}) {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ImageFallback
      images={src ? [src] : []}
      productName={initials || '?'}
      width={size}
      height={size}
      borderRadius="large"
      placeholder="gradient"
      className="avatar"
      {...props}
    />
  );
}

/**
 * Optimized image gallery component
 * @param {Object} props - Component props
 * @param {Array<string>} props.images - Array of image URLs
 * @param {string} props.productName - Product name
 * @param {Function} props.onImageSelect - Image selection callback
 */
export function ImageGallery({ 
  images = [], 
  productName, 
  onImageSelect 
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleImageSelect = useCallback((index) => {
    setSelectedIndex(index);
    onImageSelect?.(images[index], index);
  }, [images, onImageSelect]);

  if (!images.length) {
    return (
      <div className="image-gallery-empty">
        <ProductDetailImage 
          product={{ productImages: [], productName }}
        />
      </div>
    );
  }

  return (
    <div className="image-gallery">
      {/* Main image */}
      <div className="gallery-main">
        <ImageFallback
          images={[images[selectedIndex]]}
          productName={productName}
          width="100%"
          height="300px"
          borderRadius="standard"
          placeholder="skeleton"
          alt={`${productName} - Image ${selectedIndex + 1}`}
        />
      </div>
      
      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="gallery-thumbnails">
          {images.map((image, index) => (
            <button
              key={index}
              className={`gallery-thumbnail ${index === selectedIndex ? 'active' : ''}`}
              onClick={() => handleImageSelect(index)}
              aria-label={`View image ${index + 1}`}
            >
              <ImageFallback
                images={[image]}
                productName={productName}
                width={60}
                height={60}
                borderRadius="small"
                placeholder="icon"
                alt={`${productName} thumbnail ${index + 1}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// CSS styles for image components
const imageStyles = `
  /* Image container */
  .image-container {
    position: relative;
    overflow: hidden;
  }

  .product-image {
    display: block;
    width: 100%;
    height: 100%;
  }

  /* Loading overlay */
  .image-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  /* Placeholder animations */
  @keyframes skeletonPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .image-placeholder.skeleton {
    background: linear-gradient(
      90deg,
      var(--bg-tertiary) 25%,
      var(--bg-secondary) 50%,
      var(--bg-tertiary) 75%
    );
    background-size: 200% 100%;
    animation: skeletonShimmer 1.5s infinite;
  }

  @keyframes skeletonShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Avatar specific styles */
  .avatar {
    font-weight: 600;
    text-align: center;
    color: var(--text-inverse);
  }

  .avatar .image-placeholder {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
    color: var(--text-inverse);
    font-weight: 600;
  }

  /* Image gallery */
  .image-gallery {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .gallery-main {
    border-radius: var(--radius-lg);
    overflow: hidden;
    background: var(--bg-tertiary);
  }

  .gallery-thumbnails {
    display: flex;
    gap: var(--space-2);
    overflow-x: auto;
    padding: var(--space-2);
    scrollbar-width: thin;
  }

  .gallery-thumbnail {
    flex-shrink: 0;
    border: 2px solid transparent;
    border-radius: var(--radius-md);
    overflow: hidden;
    cursor: pointer;
    transition: var(--transition-fast);
    background: none;
    padding: 0;
  }

  .gallery-thumbnail:hover {
    border-color: var(--border-secondary);
    transform: scale(1.05);
  }

  .gallery-thumbnail.active {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px var(--primary-light);
  }

  .gallery-thumbnail:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  .image-gallery-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-lg);
  }

  /* Responsive image gallery */
  @media (max-width: 480px) {
    .gallery-main {
      height: 250px;
    }
    
    .gallery-thumbnail {
      width: 50px;
      height: 50px;
    }
    
    .gallery-thumbnails {
      gap: var(--space-1);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .image-placeholder {
      border: 1px solid var(--border-primary);
    }
    
    .gallery-thumbnail.active {
      border-width: 3px;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .image-placeholder.skeleton,
    .gallery-thumbnail {
      animation: none;
    }
    
    .gallery-thumbnail:hover {
      transform: none;
    }
  }

  /* Print styles */
  @media print {
    .image-loading-overlay,
    .gallery-thumbnails {
      display: none;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = imageStyles;
  document.head.appendChild(styleSheet);
}

export default ImageFallback;