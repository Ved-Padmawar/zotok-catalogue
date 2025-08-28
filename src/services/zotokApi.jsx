// Modern Zotok API service with enhanced error handling and caching

import { 
  BACKEND_HOST, 
  API_ENDPOINTS, 
  HTTP_STATUS,
  ERROR_MESSAGES,
  APP_CONFIG 
} from '../utils/constants.jsx';

/**
 * Modern Zotok API service class with comprehensive features
 */
class ZotokApiService {
  constructor() {
    this.baseURL = BACKEND_HOST;
    this.defaultTimeout = 15000; // 15 seconds for product operations
    this.cache = new Map();
    this.requestCache = new Map(); // For deduplicating concurrent requests
  }

  /**
   * Makes authenticated API request with enhanced features
   * @param {string} endpoint - API endpoint
   * @param {string} authToken - Authentication token
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, authToken, options = {}) {
    if (!authToken) {
      return {
        success: false,
        error: ERROR_MESSAGES.TOKEN_EXPIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      };
    }

    const url = `${this.baseURL}${endpoint}`;
    const requestId = `${options.method || 'GET'}-${url}`;
    
    // Check for concurrent requests
    if (this.requestCache.has(requestId)) {
      return this.requestCache.get(requestId);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      mode: 'cors',
      signal: controller.signal,
      ...options,
    };

    const requestPromise = this.executeRequest(url, defaultOptions, timeoutId, requestId);
    
    // Cache the promise to deduplicate concurrent requests
    this.requestCache.set(requestId, requestPromise);
    
    try {
      return await requestPromise;
    } finally {
      // Clean up request cache
      setTimeout(() => {
        this.requestCache.delete(requestId);
      }, 1000);
    }
  }

  /**
   * Executes the actual HTTP request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @param {number} timeoutId - Timeout ID
   * @param {string} requestId - Request identifier
   * @returns {Promise<Object>} Response object
   */
  async executeRequest(url, options, timeoutId, requestId) {
    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      if (!response.ok) {
        return {
          success: false,
          error: this.getErrorMessage(response.status, data),
          status: response.status,
          details: data.details
        };
      }

      return {
        success: data.success !== false,
        data: data.data || data,
        status: response.status,
        timestamp: Date.now()
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: ERROR_MESSAGES.CONNECTION_TIMEOUT,
          status: 0
        };
      }

      console.error('Zotok API error:', error);
      
      return {
        success: false,
        error: this.getNetworkErrorMessage(error),
        status: 0,
        details: error.message
      };
    }
  }

  /**
   * Gets products with pagination and optional filtering
   * @param {string} authToken - Authentication token
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Products response
   */
  async getProducts(authToken, params = {}) {
    const queryParams = new URLSearchParams();
    
    // Add supported parameters
    const validParams = ['page', 'limit', 'search', 'category', 'status'];
    validParams.forEach(param => {
      if (params[param] !== undefined && params[param] !== null && params[param] !== '') {
        queryParams.append(param, params[param].toString());
      }
    });

    // Set defaults
    if (!params.page) queryParams.set('page', '1');
    if (!params.limit) queryParams.set('limit', APP_CONFIG.PRODUCTS_PER_PAGE.toString());

    const queryString = queryParams.toString();
    const endpoint = `${API_ENDPOINTS.PRODUCTS}${queryString ? `?${queryString}` : ''}`;

    // Check cache for GET requests without search
    const cacheKey = `products-${queryString}`;
    if (!params.search && !params.status) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true
        };
      }
    }

    const response = await this.makeRequest(endpoint, authToken);
    
    // Cache successful responses
    if (response.success && response.data && !params.search) {
      this.setCache(cacheKey, response.data, 5 * 60 * 1000); // 5 minutes
    }

    return response;
  }

  /**
   * Gets single product by ID
   * @param {string} authToken - Authentication token
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product response
   */
  async getProduct(authToken, productId) {
    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required'
      };
    }

    const endpoint = `${API_ENDPOINTS.PRODUCT_DETAIL}/${encodeURIComponent(productId)}`;
    const cacheKey = `product-${productId}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        cached: true
      };
    }

    const response = await this.makeRequest(endpoint, authToken);
    
    // Cache successful responses
    if (response.success && response.data) {
      this.setCache(cacheKey, response.data, 10 * 60 * 1000); // 10 minutes
    }

    return response;
  }

  /**
   * Searches products with debouncing support
   * @param {string} authToken - Authentication token
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search response
   */
  async searchProducts(authToken, query, options = {}) {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        error: 'Search query must be at least 2 characters'
      };
    }

    const params = {
      search: query.trim(),
      page: options.page || 1,
      limit: options.limit || APP_CONFIG.PRODUCTS_PER_PAGE,
      ...options
    };

    return this.getProducts(authToken, params);
  }

  /**
   * Gets products by category
   * @param {string} authToken - Authentication token
   * @param {string} category - Category name
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Category products response
   */
  async getProductsByCategory(authToken, category, options = {}) {
    if (!category) {
      return {
        success: false,
        error: 'Category is required'
      };
    }

    const params = {
      category: category.trim(),
      page: options.page || 1,
      limit: options.limit || APP_CONFIG.PRODUCTS_PER_PAGE,
      ...options
    };

    return this.getProducts(authToken, params);
  }

  /**
   * Tests connection to Zotok API
   * @param {string} authToken - Authentication token
   * @returns {Promise<Object>} Connection test response
   */
  async testConnection(authToken) {
    try {
      return await this.makeRequest(API_ENDPOINTS.TEST_ZOTOK, authToken, {
        method: 'GET'
      });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to test API connection',
        details: error.message
      };
    }
  }

  /**
   * Gets API health status
   * @returns {Promise<Object>} Health status response
   */
  async getHealthStatus() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data,
          status: response.status
        };
      } else {
        return {
          success: false,
          error: `Health check failed: ${response.status}`,
          status: response.status
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Health check failed',
        details: error.message
      };
    }
  }

  /**
   * Gets data from cache if valid
   * @param {string} key - Cache key
   * @returns {*} Cached data or null
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Sets data in cache with expiration
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  setCache(key, data, ttl = 5 * 60 * 1000) {
    // Limit cache size
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      created: Date.now()
    });
  }

  /**
   * Clears cache
   * @param {string} pattern - Optional pattern to match keys
   */
  clearCache(pattern = null) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Gets error message based on status code
   * @param {number} status - HTTP status code
   * @param {Object} data - Response data
   * @returns {string} Error message
   */
  getErrorMessage(status, data) {
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return data.error || 'Invalid request parameters';
      case HTTP_STATUS.UNAUTHORIZED:
        return ERROR_MESSAGES.TOKEN_EXPIRED;
      case HTTP_STATUS.FORBIDDEN:
        return 'Access denied to this resource';
      case HTTP_STATUS.NOT_FOUND:
        return 'Requested resource not found';
      case HTTP_STATUS.CONFLICT:
        return data.error || 'Conflict with existing data';
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return ERROR_MESSAGES.SERVER_ERROR;
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return 'Zotok service temporarily unavailable';
      default:
        return data.error || `HTTP ${status}: ${data.message || 'Unknown error'}`;
    }
  }

  /**
   * Gets network error message
   * @param {Error} error - Network error
   * @returns {string} Error message
   */
  getNetworkErrorMessage(error) {
    if (error.message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (error.message.includes('CORS')) {
      return 'Cross-origin request blocked. Please check server configuration.';
    }
    return `Network error: ${error.message}`;
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    const stats = {
      size: this.cache.size,
      entries: [],
      totalSize: 0
    };

    for (const [key, value] of this.cache) {
      const entry = {
        key,
        created: new Date(value.created),
        expires: new Date(value.expires),
        isExpired: Date.now() > value.expires,
        dataSize: JSON.stringify(value.data).length
      };
      stats.entries.push(entry);
      stats.totalSize += entry.dataSize;
    }

    return stats;
  }

  /**
   * Updates service configuration
   * @param {Object} config - Configuration updates
   */
  updateConfig(config = {}) {
    if (config.timeout && typeof config.timeout === 'number') {
      this.defaultTimeout = config.timeout;
    }
    if (config.baseURL && typeof config.baseURL === 'string') {
      this.baseURL = config.baseURL;
    }
  }

  /**
   * Gets current service configuration
   * @returns {Object} Service configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.defaultTimeout,
      cacheSize: this.cache.size,
      endpoints: API_ENDPOINTS
    };
  }
}

// Create and export singleton instance
export const zotokApi = new ZotokApiService();

// Export class for testing
export { ZotokApiService };

// Export individual methods for convenience
export const {
  getProducts,
  getProduct,
  searchProducts,
  getProductsByCategory,
  testConnection,
  getHealthStatus
} = zotokApi;

export default zotokApi;