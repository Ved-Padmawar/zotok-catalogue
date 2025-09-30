// Modern products hook for data fetching with pagination and caching

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPaginationState } from '../types/index.jsx';
import { fetchProducts, fetchProductDetail } from '../utils/api.jsx';
import { 
  APP_CONFIG, 
  ERROR_MESSAGES, 
  PERFORMANCE,
  PRODUCT_CATEGORIES 
} from '../utils/constants.jsx';

/**
 * Main products hook with advanced features
 * @param {Object} options - Hook options
 * @param {boolean} options.autoLoad - Auto load on mount
 * @param {number} options.pageSize - Items per page
 * @param {boolean} options.enableCache - Enable caching
 * @returns {Object} Products state and methods
 */
export function useProducts(options = {}) {
  const {
    autoLoad = true,
    pageSize = APP_CONFIG.PRODUCTS_PER_PAGE,
    enableCache = true
  } = options;

  // State management
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(createPaginationState());
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  // Refs for cache and cleanup
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  /**
   * Generates cache key for request
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {string} Cache key
   */
  const getCacheKey = useCallback((page, limit) => {
    return `products-${page}-${limit}`;
  }, []);

  /**
   * Gets cached products if available and valid
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data or null
   */
  const getCachedData = useCallback((key) => {
    if (!enableCache) return null;
    
    const cached = cacheRef.current.get(key);
    if (!cached) return null;
    
    // Check if cache is expired (5 minutes)
    const cacheAge = Date.now() - cached.timestamp;
    if (cacheAge > 5 * 60 * 1000) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return cached.data;
  }, [enableCache]);

  /**
   * Stores data in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  const setCachedData = useCallback((key, data) => {
    if (!enableCache) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (cacheRef.current.size > 20) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
  }, [enableCache]);

  /**
   * Loads products for a specific page
   * @param {number} page - Page number
   * @param {boolean} append - Whether to append to existing products
   */
  const loadProducts = useCallback(async (page = 1, append = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = getCacheKey(page, pageSize);
      const cachedData = getCachedData(cacheKey);
      
      if (cachedData) {
        // Using cached data
        
        if (append) {
          setProducts(prev => [...prev, ...cachedData.products]);
        } else {
          setProducts(cachedData.products);
        }
        
        setPagination(cachedData.pagination);
        setHasLoadedOnce(true);
        setIsLoading(false);
        return;
      }

      // Fetch from API
      const response = await fetchProducts(page, pageSize);
      
      if (response.success && response.data) {
        const newProducts = response.data.products || [];
        const totalPages = Math.ceil((response.data.total || 0) / pageSize);
        
        // Add unique IDs to products if they don't have them
        const productsWithIds = newProducts.map((product, index) => ({
          ...product,
          id: product.skuCode || product.id || `product-${page}-${index}`,
        }));

        // Update products list
        const updatedProducts = append 
          ? [...products, ...productsWithIds]
          : productsWithIds;
        
        setProducts(updatedProducts);
        
        // Update pagination state
        const newPagination = createPaginationState({
          currentPage: page,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        });
        
        setPagination(newPagination);
        setHasLoadedOnce(true);

        // Cache the data
        setCachedData(cacheKey, {
          products: productsWithIds,
          pagination: newPagination
        });
        
      } else {
        setError(response.error || ERROR_MESSAGES.PRODUCTS_LOAD_FAILED);
        setProducts(append ? products : []);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Load products error:', error);
        setError(error instanceof Error ? error.message : ERROR_MESSAGES.PRODUCTS_LOAD_FAILED);
        setProducts(append ? products : []);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [pageSize, getCacheKey, getCachedData, setCachedData, products]);

  /**
   * Loads next page of products
   */
  const loadNextPage = useCallback(async () => {
    if (pagination.hasNextPage && !isLoading) {
      await loadProducts(pagination.currentPage + 1, true);
    }
  }, [pagination.hasNextPage, pagination.currentPage, isLoading, loadProducts]);

  /**
   * Loads previous page of products
   */
  const loadPreviousPage = useCallback(async () => {
    if (pagination.hasPreviousPage && !isLoading) {
      await loadProducts(pagination.currentPage - 1, false);
    }
  }, [pagination.hasPreviousPage, pagination.currentPage, isLoading, loadProducts]);

  /**
   * Refreshes current page
   */
  const refresh = useCallback(async () => {
    // Clear cache for current page
    const cacheKey = getCacheKey(pagination.currentPage, pageSize);
    cacheRef.current.delete(cacheKey);
    
    await loadProducts(pagination.currentPage, false);
  }, [pagination.currentPage, pageSize, getCacheKey, loadProducts]);

  /**
   * Clears all data and cache
   */
  const reset = useCallback(() => {
    setProducts([]);
    setError(null);
    setPagination(createPaginationState());
    setHasLoadedOnce(false);
    cacheRef.current.clear();
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && !hasLoadedOnce) {
      loadProducts();
    }
  }, [autoLoad, hasLoadedOnce, loadProducts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    products,
    isLoading,
    error,
    pagination,
    loadProducts,
    loadNextPage,
    loadPreviousPage,
    refresh,
    reset,
    clearError,
    hasLoadedOnce
  };
}

/**
 * Hook for single product detail with caching
 * @returns {Object} Product detail state and methods
 */
export function useProductDetail() {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cache for product details
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  /**
   * Loads product details by ID
   * @param {string} productId - Product ID
   */
  const loadProduct = useCallback(async (productId) => {
    if (!productId) {
      setError('Product ID is required');
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      const cached = cacheRef.current.get(productId);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setProduct(cached.data);
        setIsLoading(false);
        return;
      }

      const response = await fetchProductDetail(productId);
      
      if (response.success && response.data) {
        const productWithId = {
          ...response.data,
          id: response.data.skuCode || productId,
        };
        
        setProduct(productWithId);
        
        // Cache the product
        cacheRef.current.set(productId, {
          data: productWithId,
          timestamp: Date.now()
        });
        
      } else {
        setError(response.error || ERROR_MESSAGES.PRODUCT_DETAIL_FAILED);
        setProduct(null);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Load product detail error:', error);
        setError(error instanceof Error ? error.message : ERROR_MESSAGES.PRODUCT_DETAIL_FAILED);
        setProduct(null);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Clears current product
   */
  const clearProduct = useCallback(() => {
    setProduct(null);
    setError(null);
  }, []);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    product,
    isLoading,
    error,
    loadProduct,
    clearProduct,
    clearError
  };
}

/**
 * Hook for product search with debouncing
 * @param {Array} products - Products to search
 * @param {Object} options - Search options
 * @returns {Object} Search state and methods
 */
export function useProductSearch(products = [], options = {}) {
  const {
    debounceMs = PERFORMANCE.DEBOUNCE_SEARCH_MS,
    searchFields = ['productName', 'skuCode', 'categoryName'],
    caseSensitive = false
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [isSearching, setIsSearching] = useState(false);
  
  const timeoutRef = useRef(null);

  /**
   * Performs the actual search
   * @param {string} query - Search query
   * @param {Array} productList - Products to search
   */
  const performSearch = useCallback((query, productList) => {
    if (!query.trim()) {
      setFilteredProducts(productList);
      return;
    }

    const searchTerm = caseSensitive ? query : query.toLowerCase();
    
    const filtered = productList.filter(product => {
      return searchFields.some(field => {
        const value = product[field];
        if (!value) return false;
        
        const searchValue = caseSensitive ? String(value) : String(value).toLowerCase();
        return searchValue.includes(searchTerm);
      });
    });

    setFilteredProducts(filtered);
  }, [searchFields, caseSensitive]);

  /**
   * Updates search query with debouncing
   * @param {string} query - Search query
   */
  const updateQuery = useCallback((query) => {
    setSearchQuery(query);
    setIsSearching(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      performSearch(query, products);
      setIsSearching(false);
    }, debounceMs);
  }, [debounceMs, performSearch, products]);

  /**
   * Clears search query and results
   */
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredProducts(products);
    setIsSearching(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [products]);

  // Update filtered products when products change
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery, products);
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchQuery, performSearch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    searchQuery,
    filteredProducts,
    isSearching,
    updateQuery,
    clearSearch,
    resultCount: filteredProducts.length
  };
}

export default useProducts;