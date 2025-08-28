import React, { useState, useEffect } from 'react';
import { LOADING_MESSAGES } from '../utils/constants.jsx';

/**
 * Enhanced Skeleton Loader Component
 */
export function Skeleton({ 
  className = '', 
  style = {},
  width = '100%',
  height = '20px',
  borderRadius = 'var(--radius-sm)',
  animation = true
}) {
  return (
    <div 
      className={`skeleton-loader ${className} ${animation ? 'skeleton-animated' : ''}`} 
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
}

/**
 * Product List Skeleton - Optimized for sidebar
 */
export function ProductListSkeleton({ count = 6 }) {
  return (
    <div className="product-list-skeleton-container" aria-label="Loading products">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="product-item-skeleton fade-in">
          <div className="skeleton-thumbnail-container">
            <Skeleton 
              width="48px" 
              height="48px" 
              borderRadius="var(--radius-md)"
            />
          </div>
          <div className="skeleton-item-content">
            <Skeleton 
              width="70%" 
              height="14px" 
              style={{ marginBottom: 'var(--space-sm)' }}
            />
            <div style={{ 
              display: 'flex', 
              gap: 'var(--space-sm)', 
              marginBottom: 'var(--space-xs)' 
            }}>
              <Skeleton width="60px" height="12px" />
              <Skeleton width="80px" height="12px" />
            </div>
            <Skeleton width="40%" height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Product Detail Skeleton
 */
export function ProductDetailSkeleton() {
  return (
    <div className="detail-container">
      {/* Header Skeleton */}
      <div className="detail-header">
        <Skeleton width="32px" height="32px" borderRadius="var(--radius-md)" />
        <Skeleton width="60%" height="18px" />
        <Skeleton width="80px" height="32px" borderRadius="var(--radius-md)" />
      </div>
      
      {/* Content Skeleton */}
      <div className="detail-content">
        {/* Images Section */}
        <div className="detail-section">
          <div className="section-header">
            <Skeleton width="120px" height="14px" />
          </div>
          <div className="section-content">
            <div className="images-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton 
                  key={index}
                  width="80px" 
                  height="80px" 
                  borderRadius="var(--radius-md)"
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Info Sections */}
        {Array.from({ length: 3 }).map((_, sectionIndex) => (
          <div key={sectionIndex} className="detail-section">
            <div className="section-header">
              <Skeleton width="100px" height="14px" />
            </div>
            <div className="section-content">
              <div className="field-grid">
                {Array.from({ length: 2 }).map((_, fieldIndex) => (
                  <div key={fieldIndex} className="field-item-skeleton">
                    <Skeleton width="60px" height="12px" style={{ marginBottom: 'var(--space-sm)' }} />
                    <Skeleton width="80%" height="16px" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Inline Loading Spinner
 */
export function InlineLoader({ 
  className = '', 
  size = 'md',
  color = 'var(--primary)'
}) {
  const sizes = {
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  };

  return (
    <div 
      className={`loading-spinner ${className}`} 
      role="status" 
      aria-label="Loading"
      style={{
        width: sizes[size],
        height: sizes[size],
        borderColor: 'var(--border-primary)',
        borderTopColor: color
      }}
    />
  );
}

/**
 * Full Page Loader with Progress
 */
export function PageLoader({ 
  message = LOADING_MESSAGES.LOADING_PRODUCTS,
  showProgress = false,
  progress = 0,
  details = null
}) {
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-container fade-in">
      <div className="loading-content">
        {/* Main Spinner */}
        <div className="loading-spinner-container">
          <div className="loading-spinner" />
          <div className="loading-ripple">
            <div />
            <div />
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="loading-text">
          {message}{dots}
        </div>
        
        {/* Progress Bar */}
        {showProgress && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
            <div className="progress-text">
              {Math.round(progress)}%
            </div>
          </div>
        )}
        
        {/* Additional Details */}
        {details && (
          <div className="loading-details">
            {details}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Loading Overlay Component
 */
export function LoadingOverlay({ 
  isLoading,
  message = 'Loading...',
  backdrop = true,
  spinnerSize = 'lg'
}) {
  if (!isLoading) return null;

  return (
    <div 
      className={`loading-overlay ${backdrop ? 'with-backdrop' : ''}`}
      aria-hidden="true"
    >
      <div className="loading-overlay-content">
        <InlineLoader size={spinnerSize} />
        {message && (
          <div className="loading-overlay-text">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Button Loading State
 */
export function LoadingButton({ 
  isLoading,
  loadingText = 'Loading...',
  children,
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`btn ${className} ${isLoading ? 'loading' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <InlineLoader size="sm" />
          <span style={{ marginLeft: 'var(--space-sm)' }}>
            {loadingText}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Search Loading Component
 */
export function SearchLoading({ query, resultCount }) {
  return (
    <div className="search-loading">
      <div className="search-loading-content">
        <InlineLoader size="sm" />
        <span>
          Searching for "{query}"...
        </span>
      </div>
      {resultCount !== null && (
        <div className="search-results-preview">
          {resultCount} results found
        </div>
      )}
    </div>
  );
}

/**
 * Image Loading Placeholder
 */
export function ImageLoadingPlaceholder({ 
  width = '100px',
  height = '100px',
  alt = 'Loading image'
}) {
  return (
    <div 
      className="image-loading-placeholder"
      style={{ width, height }}
      role="img"
      aria-label={alt}
    >
      <div className="image-loading-content">
        <div className="image-loading-icon">🖼️</div>
        <InlineLoader size="sm" />
      </div>
    </div>
  );
}

/**
 * Progressive Loading Component for Lists
 */
export function ProgressiveLoader({ 
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 100
}) {
  const [sentinelRef, setSentinelRef] = useState(null);

  useEffect(() => {
    if (!sentinelRef || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: `${threshold}px` }
    );

    observer.observe(sentinelRef);

    return () => observer.disconnect();
  }, [sentinelRef, hasMore, isLoading, onLoadMore, threshold]);

  if (!hasMore) return null;

  return (
    <div ref={setSentinelRef} className="progressive-loader">
      {isLoading ? (
        <div className="progressive-loader-content">
          <InlineLoader size="md" />
          <span>Loading more items...</span>
        </div>
      ) : (
        <div className="progressive-loader-trigger">
          <button onClick={onLoadMore} className="btn btn-tertiary">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

// CSS Styles for Loading Components
const loadingStyles = `
  /* Base skeleton loader */
  .skeleton-loader {
    background: linear-gradient(90deg, 
      var(--bg-tertiary) 25%, 
      var(--bg-hover) 50%, 
      var(--bg-tertiary) 75%);
    border-radius: var(--radius-sm);
    display: block;
  }

  .skeleton-animated {
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Product list skeleton */
  .product-list-skeleton-container {
    padding: 0;
  }

  .product-item-skeleton {
    display: flex;
    align-items: center;
    gap: var(--space-lg);
    padding: var(--space-lg);
    border-bottom: 1px solid var(--border-primary);
  }

  .skeleton-thumbnail-container {
    flex-shrink: 0;
  }

  .skeleton-item-content {
    flex: 1;
    min-width: 0;
  }

  .field-item-skeleton {
    background: var(--bg-input);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    padding: var(--space-lg);
    margin-bottom: var(--space-md);
  }

  /* Page loader */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: var(--space-3xl);
    text-align: center;
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-lg);
    max-width: 300px;
  }

  .loading-spinner-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-primary);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    z-index: 2;
    position: relative;
  }

  .loading-ripple {
    position: absolute;
    width: 32px;
    height: 32px;
  }

  .loading-ripple div {
    position: absolute;
    border: 2px solid var(--primary);
    opacity: 1;
    border-radius: 50%;
    animation: ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
  }

  .loading-ripple div:nth-child(2) {
    animation-delay: -0.5s;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes ripple {
    0% {
      top: 14px;
      left: 14px;
      width: 0;
      height: 0;
      opacity: 1;
    }
    100% {
      top: -2px;
      left: -2px;
      width: 32px;
      height: 32px;
      opacity: 0;
    }
  }

  .loading-text {
    font-size: var(--text-base);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
    text-align: center;
    line-height: var(--line-height-relaxed);
  }

  /* Progress bar */
  .loading-progress {
    width: 100%;
    max-width: 200px;
    margin-top: var(--space-md);
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    overflow: hidden;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--primary-hover));
    border-radius: inherit;
    transition: width 0.3s ease;
    position: relative;
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: progress-shine 2s ease-in-out infinite;
  }

  @keyframes progress-shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .progress-text {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    text-align: center;
    margin-top: var(--space-sm);
    font-weight: var(--font-weight-medium);
  }

  .loading-details {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    text-align: center;
    line-height: var(--line-height-relaxed);
  }

  /* Loading overlay */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    border-radius: inherit;
  }

  .loading-overlay.with-backdrop {
    background: var(--bg-overlay);
    backdrop-filter: blur(2px);
  }

  .loading-overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    background: var(--bg-card);
    padding: var(--space-xl);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-primary);
  }

  .loading-overlay-text {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    font-weight: var(--font-weight-medium);
  }

  /* Loading button */
  .btn.loading {
    position: relative;
    pointer-events: none;
  }

  .btn.loading {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Search loading */
  .search-loading {
    padding: var(--space-md) var(--space-lg);
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-primary);
  }

  .search-loading-content {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .search-results-preview {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin-top: var(--space-sm);
  }

  /* Image loading placeholder */
  .image-loading-placeholder {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .image-loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    color: var(--text-tertiary);
  }

  .image-loading-icon {
    font-size: 24px;
    opacity: 0.5;
  }

  /* Progressive loader */
  .progressive-loader {
    padding: var(--space-xl);
    text-align: center;
    border-top: 1px solid var(--border-primary);
  }

  .progressive-loader-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .progressive-loader-trigger {
    display: flex;
    justify-content: center;
  }

  /* Responsive adjustments */
  @media (max-width: 600px) {
    .loading-container {
      padding: var(--space-xl);
      min-height: 150px;
    }

    .loading-spinner {
      width: 24px;
      height: 24px;
    }

    .loading-ripple {
      width: 24px;
      height: 24px;
    }

    .product-item-skeleton {
      padding: var(--space-md);
      gap: var(--space-md);
    }
  }

  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .skeleton-animated,
    .loading-spinner,
    .loading-ripple div,
    .progress-fill::after {
      animation: none;
    }

    .skeleton-loader {
      background: var(--bg-tertiary);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .loading-spinner {
      border-width: 4px;
    }

    .progress-bar {
      border: 1px solid var(--border-primary);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('loading-states-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'loading-states-styles';
    styleSheet.textContent = loadingStyles;
    document.head.appendChild(styleSheet);
  }
}

export default {
  Skeleton,
  ProductListSkeleton,
  ProductDetailSkeleton,
  InlineLoader,
  PageLoader,
  LoadingOverlay,
  LoadingButton,
  SearchLoading,
  ImageLoadingPlaceholder,
  ProgressiveLoader
};