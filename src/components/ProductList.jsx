import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { TextInput, SearchIcon, HorizontalCard, Badge, Title, Text, Button, Rows } from "@canva/app-ui-kit";
import { zotokApi } from "../services/zotokApi.jsx";
import { useDragDrop } from "../hooks/useDragDrop.jsx";
import {
  APP_CONFIG,
  PERFORMANCE,
  ERROR_MESSAGES,
  CURRENCY
} from "../utils/constants.jsx";

/**
 * Enhanced Product List Component with new UI design
 * @param {Object} props - Component props
 * @param {string} props.authToken - Authentication token
 * @param {Function} props.onProductSelect - Product selection handler
 * @param {Function} props.onTokenExpired - Token expiry handler
 */
export default function ProductList({ 
  authToken, 
  onProductSelect, 
  onTokenExpired 
}) {
  // State management
  const [allProducts, setAllProducts] = useState([]); // All products from API
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [dragLoadingStates, setDragLoadingStates] = useState({});
  
  // Refs
  const searchTimeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isInitialLoad = useRef(true);

  // Drag and drop hook
  const { handleProductDrag, handleProductClick } = useDragDrop();

  /**
   * Formats price with currency symbol
   */
  const formatPrice = useCallback((price) => {
    if (!price || isNaN(price)) return null;
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${CURRENCY.SYMBOL}${numPrice.toFixed(CURRENCY.DECIMAL_PLACES)}`;
  }, []);

  /**
   * Gets the primary product image URL
   */
  const getProductImage = useCallback((productImages) => {
    if (!productImages) return null;
    
    if (typeof productImages === 'string') {
      const urls = productImages.split(',').map(url => url.trim());
      return urls[0] || null;
    } else if (Array.isArray(productImages)) {
      return productImages[0] || null;
    }
    
    return null;
  }, []);

  /**
   * Client-side search with fuzzy matching
   * Searches through product name and SKU code only
   */
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return allProducts;
    }

    const query = searchQuery.toLowerCase().trim();
    
    return allProducts.filter(product => {
      // Search in product name
      const nameMatch = typeof product.productName === 'string' 
        ? product.productName.toLowerCase().includes(query)
        : false;
      
      // Search in SKU code
      const skuMatch = typeof product.skuCode === 'string'
        ? product.skuCode.toLowerCase().includes(query)
        : false;
      
      return nameMatch || skuMatch;
    });
  }, [allProducts, searchQuery]);

  /**
   * Debounced search handler
   */
  const handleSearchChange = useCallback((value) => {
    const safeValue = value || '';
    setSearchQuery(safeValue);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Optional: Add search analytics after debounce
    searchTimeoutRef.current = setTimeout(() => {
      // Search analytics could be added here if needed
    }, PERFORMANCE.DEBOUNCE_SEARCH_MS);
  }, []);

  /**
   * Clears search query
   */
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  /**
   * Loads products from API
   */
  const loadProducts = useCallback(async (page = 1, reset = false) => {
    try {
      if (page === 1 && reset) {
        setIsLoading(true);
        setError('');
        setCurrentPage(1);
        setHasMorePages(true);
      } else if (page > 1) {
        setIsLoadingMore(true);
      }

      const response = await zotokApi.getProducts(authToken, {
        page,
        limit: APP_CONFIG.PRODUCTS_PER_PAGE
      });

      if (response.success && response.data) {
        let newProducts = [];
        
        if (Array.isArray(response.data.products)) {
          newProducts = response.data.products;
        } else if (Array.isArray(response.data)) {
          newProducts = response.data;
        } else {
          console.warn('Unexpected API response structure:', response.data);
          newProducts = [];
        }
        
        // Add unique IDs to products if they don't have them
        const productsWithIds = newProducts.map((product, index) => ({
          ...product,
          id: product.skuCode || product.id || `product-${page}-${index}`,
        }));
        
        const updatedProducts = reset || page === 1 
          ? productsWithIds 
          : [...allProducts, ...productsWithIds];
        
        setAllProducts(updatedProducts);
        setHasMorePages(newProducts.length === APP_CONFIG.PRODUCTS_PER_PAGE);
        setCurrentPage(page);
        
      } else {
        if (response.error?.includes('401') || response.error?.includes('token')) {
          const refreshed = await onTokenExpired();
          if (refreshed) {
            return loadProducts(page, reset);
          }
        }
        setError(response.error || ERROR_MESSAGES.PRODUCTS_LOAD_FAILED);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      
      if (err.message?.includes('401') || err.message?.includes('token')) {
        const refreshed = await onTokenExpired();
        if (refreshed) {
          return loadProducts(page, reset);
        }
      }
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [authToken, onTokenExpired, allProducts]);

  /**
   * Handles scroll events for infinite loading
   */
  const handleScroll = useCallback((event) => {
    // Don't load more pages if searching (client-side filtering) or no more pages available
    if (!hasMorePages || isLoadingMore || searchQuery.trim()) return;
    
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (isNearBottom) {
      loadProducts(currentPage + 1, false);
    }
  }, [hasMorePages, isLoadingMore, searchQuery, currentPage, loadProducts]);

  /**
   * Handles retry attempts
   */
  const handleRetry = useCallback(() => {
    setError('');
    loadProducts(1, true);
  }, [loadProducts]);

  /**
   * Handles product drag with loading state
   */
  const handleProductDragWithLoading = useCallback(async (event, product) => {
    const productId = product.id || product.skuCode;
    
    try {
      setDragLoadingStates(prev => ({ ...prev, [productId]: true }));
      await handleProductDrag(event, product);
    } catch (error) {
      console.error('Product drag failed:', error);
    } finally {
      setDragLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
  }, [handleProductDrag]);

  /**
   * Handles product click with loading state
   */
  const handleProductClickWithLoading = useCallback(async (product) => {
    const productId = product.id || product.skuCode;
    
    try {
      setDragLoadingStates(prev => ({ ...prev, [productId]: true }));
      await handleProductClick(product);
    } catch (error) {
      console.error('Product click failed:', error);
    } finally {
      setDragLoadingStates(prev => ({ ...prev, [productId]: false }));
    }
  }, [handleProductClick]);

  /**
   * Handles keyboard events for product items
   */
  const handleProductKeyDown = useCallback((event, product) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      
      // Ctrl/Cmd + Enter/Space = Add to design
      if (event.ctrlKey || event.metaKey) {
        handleProductClickWithLoading(product);
      } else {
        // Regular Enter/Space = View details
        onProductSelect(product);
      }
    }
  }, [handleProductClickWithLoading, onProductSelect]);

  // Initial load effect
  useEffect(() => {
    if (isInitialLoad.current) {
      loadProducts(1, true);
      isInitialLoad.current = false;
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="products-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <div className="loading-text">Loading products...</div>
        </div>
      </div>
    );
  }

  // Error state - but only if we have no products at all and are not searching
  if (error && allProducts.length === 0 && !searchQuery.trim()) {
    return (
      <div className="products-container">
        <div className="error-state">
          <div className="error-title">Unable to Load Products</div>
          <div className="error-message">{error}</div>
          <button onClick={handleRetry} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-container">
      {/* Error Banner - show if there's an error but we have products or user is searching */}
      {error && (allProducts.length > 0 || searchQuery.trim()) && (
        <div className="error-banner">
          <div className="error-banner-content">
            <svg className="icon" viewBox="0 0 24 24"><path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
            <span className="error-banner-text">{error}</span>
            <button onClick={handleRetry} className="error-banner-retry">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="search-section">
        <TextInput
          placeholder="Search products..."
          value={searchQuery || ''}
          onChange={handleSearchChange}
          start={<SearchIcon style={{ color: 'var(--ui-kit-color-text-secondary)' }} />}
          end={searchQuery && (
            <button
              onClick={handleClearSearch}
              style={{
                fontSize: '18px',
                color: 'var(--ui-kit-color-text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        />

        <div className="search-results-info">
          <span className="results-badge">{filteredProducts.length}</span>
          result{filteredProducts.length !== 1 ? 's' : ''}
          {searchQuery && ` for "${searchQuery}"`}
        </div>
      </div>

      {/* Products List */}
      <div 
        className="products-scroll-area"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {filteredProducts.length > 0 ? (
          <div className="products-list">
            {filteredProducts.map((product, index) => {
              const productId = product.id || product.skuCode;
              const imageUrl = getProductImage(product.productImages);
              const price = formatPrice(product.price);
              const isLoadingDrag = dragLoadingStates[productId];
              
              return (
                <HorizontalCard
                  key={productId}
                  thumbnail={imageUrl ? { url: imageUrl, alt: product.productName || 'Product image' } : undefined}
                  title={product.productName || 'Unnamed Product'}
                  description={product.skuCode ? `SKU: ${product.skuCode}` : (product.categoryName || 'No SKU')}
                  decorators={price ? [<Badge key="price">{price}</Badge>] : []}
                  onClick={() => onProductSelect(product)}
                  onDragStart={(e) => handleProductDragWithLoading(e, product)}
                  onKeyDown={(e) => handleProductKeyDown(e, product)}
                  draggable={!isLoadingDrag}
                  ariaLabel={`${product.productName || 'Product'}. ${price ? `Price: ${price}. ` : ''}Click to view details`}
                />
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Rows spacing="2u" align="center">
              <div className="empty-icon">📦</div>
              <Title size="small">
                {searchQuery ? 'No products found' : "Nothing's here yet"}
              </Title>
              <Text size="small" color="secondary">
                {searchQuery
                  ? `No products match "${searchQuery}". Try a different search term.`
                  : 'Add products to your account to get started'
                }
              </Text>
              {searchQuery ? (
                <Button
                  variant="secondary"
                  onClick={handleClearSearch}
                >
                  Clear search
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => window.open('https://zotok.com', '_blank')}
                >
                  Go to Zotok Catalogue
                </Button>
              )}
            </Rows>
          </div>
        )}
        
        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className="loading-more">
            <div className="loading-spinner small" />
            <div className="loading-text">Loading more products...</div>
          </div>
        )}
        
        {/* End of List Indicator */}
        {!searchQuery && 
         !isLoadingMore && 
         !hasMorePages && 
         filteredProducts.length > 0 && (
          <div className="end-of-list">
            All products loaded ({filteredProducts.length} total)
          </div>
        )}
      </div>
    </div>
  );
}