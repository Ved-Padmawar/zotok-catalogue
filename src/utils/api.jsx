// Modern API utilities for backend communication with enhanced features

import { 
  BACKEND_HOST, 
  API_ENDPOINTS, 
  ERROR_MESSAGES,
  HTTP_STATUS,
  PERFORMANCE
} from './constants.jsx';
import { getStoredToken } from './auth.jsx';

/**
 * Enhanced fetch wrapper with comprehensive error handling and retry logic
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Response>} Response object
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${BACKEND_HOST}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    mode: 'cors',
    ...options,
  };

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(ERROR_MESSAGES.CONNECTION_TIMEOUT);
    }
    
    console.error('Network error:', error);
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
  }
}

/**
 * Processes API response with enhanced error handling
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Processed response object
 */
async function processResponse(response) {
  let data;
  const contentType = response.headers.get('content-type');
  
  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }
  } catch (error) {
    data = { message: 'Invalid response format' };
  }

  if (!response.ok) {
    return {
      success: false,
      error: getErrorMessage(response.status, data),
      status: response.status,
      details: data.details || data.message
    };
  }

  return {
    success: true,
    data: data.data || data,
    status: response.status,
    timestamp: Date.now()
  };
}

/**
 * Gets appropriate error message based on HTTP status
 * @param {number} status - HTTP status code
 * @param {Object} data - Response data
 * @returns {string} Error message
 */
function getErrorMessage(status, data) {
  switch (status) {
    case HTTP_STATUS.BAD_REQUEST:
      return data.error || 'Invalid request data';
    case HTTP_STATUS.UNAUTHORIZED:
      return ERROR_MESSAGES.TOKEN_EXPIRED;
    case HTTP_STATUS.FORBIDDEN:
      return 'Access forbidden';
    case HTTP_STATUS.NOT_FOUND:
      return 'Resource not found';
    case HTTP_STATUS.CONFLICT:
      return data.error || 'Conflict with existing data';
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return ERROR_MESSAGES.SERVER_ERROR;
    case HTTP_STATUS.SERVICE_UNAVAILABLE:
      return 'Service temporarily unavailable';
    default:
      return data.error || `HTTP ${status}: ${data.message || 'Unknown error'}`;
  }
}

/**
 * Retry wrapper for API calls with exponential backoff
 * @param {Function} apiCall - API call function
 * @param {Object} options - Retry options
 * @returns {Promise<Object>} API response
 */
async function withRetry(apiCall, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 5000,
    retryCondition = (error) => error.status >= 500 || error.status === 0
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or if retry condition not met
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Authenticates with Zotok API using credentials
 * @param {Object} credentials - Zotok credentials
 * @param {string} canvaUserId - Canva user ID
 * @returns {Promise<Object>} Authentication response
 */
export async function authenticateWithZotok(credentials, canvaUserId) {
  // Validate inputs
  if (!credentials || !canvaUserId) {
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_CREDENTIALS
    };
  }

  const { workspaceId, clientId, clientSecret } = credentials;
  if (!workspaceId || !clientId || !clientSecret) {
    return {
      success: false,
      error: ERROR_MESSAGES.INVALID_CREDENTIALS
    };
  }

  try {
    const response = await apiFetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: workspaceId.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        canvaUserId
      }),
    });

    return await processResponse(response);
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.AUTH_FAILED
    };
  }
}

/**
 * Retrieves stored token for user with retry
 * @param {string} canvaUserId - Canva user ID
 * @returns {Promise<Object>} Token response
 */
export async function getStoredUserToken(canvaUserId) {
  if (!canvaUserId) {
    return {
      success: false,
      error: 'User ID is required'
    };
  }

  try {
    return await withRetry(async () => {
      const response = await apiFetch(
        `${API_ENDPOINTS.TOKEN}?canvaUserId=${encodeURIComponent(canvaUserId)}`
      );
      return await processResponse(response);
    });
  } catch (error) {
    console.error('Get token error:', error);
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.AUTH_FAILED
    };
  }
}

/**
 * Refreshes expired token using stored credentials
 * @param {string} canvaUserId - Canva user ID
 * @returns {Promise<Object>} Refresh response
 */
export async function refreshUserToken(canvaUserId) {
  if (!canvaUserId) {
    return {
      success: false,
      error: 'User ID is required'
    };
  }

  try {
    return await withRetry(async () => {
      const response = await apiFetch(API_ENDPOINTS.REFRESH, {
        method: 'POST',
        body: JSON.stringify({ canvaUserId }),
      });
      return await processResponse(response);
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.AUTH_FAILED
    };
  }
}

/**
 * Fetches products with pagination and caching support
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Products response
 */
export async function fetchProducts(page = 1, limit = 20, options = {}) {
  const token = getStoredToken();
  if (!token) {
    return {
      success: false,
      error: ERROR_MESSAGES.TOKEN_EXPIRED
    };
  }

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...options
  });

  try {
    return await withRetry(async () => {
      const response = await apiFetch(
        `${API_ENDPOINTS.PRODUCTS}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return await processResponse(response);
    }, {
      retryCondition: (error) => error.status >= 500 || error.status === 0
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.PRODUCTS_LOAD_FAILED
    };
  }
}

/**
 * Fetches single product details by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product detail response
 */
export async function fetchProductDetail(productId) {
  if (!productId) {
    return {
      success: false,
      error: 'Product ID is required'
    };
  }

  const token = getStoredToken();
  if (!token) {
    return {
      success: false,
      error: ERROR_MESSAGES.TOKEN_EXPIRED
    };
  }

  try {
    return await withRetry(async () => {
      const response = await apiFetch(
        `${API_ENDPOINTS.PRODUCT_DETAIL}/${encodeURIComponent(productId)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return await processResponse(response);
    });
  } catch (error) {
    console.error('Fetch product detail error:', error);
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.PRODUCT_DETAIL_FAILED
    };
  }
}

/**
 * Tests connection to Zotok API
 * @returns {Promise<Object>} Connection test response
 */
export async function testZotokConnection() {
  const token = getStoredToken();
  if (!token) {
    return {
      success: false,
      error: ERROR_MESSAGES.TOKEN_EXPIRED
    };
  }

  try {
    const response = await apiFetch(API_ENDPOINTS.TEST_ZOTOK, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await processResponse(response);
  } catch (error) {
    console.error('Test connection error:', error);
    return {
      success: false,
      error: error.message || ERROR_MESSAGES.NETWORK_ERROR
    };
  }
}

/**
 * Performs health check on backend services
 * @returns {Promise<Object>} Health check response
 */
export async function checkHealth() {
  try {
    const response = await apiFetch(API_ENDPOINTS.HEALTH);
    return await processResponse(response);
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}

/**
 * Searches products with debouncing
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search response
 */
export async function searchProducts(query, options = {}) {
  if (!query || query.trim().length < 2) {
    return {
      success: false,
      error: 'Search query must be at least 2 characters'
    };
  }

  return fetchProducts(options.page || 1, options.limit || 20, {
    search: query.trim(),
    ...options
  });
}

/**
 * Batch API request handler
 * @param {Array<Function>} requests - Array of request functions
 * @param {Object} options - Batch options
 * @returns {Promise<Array>} Array of responses
 */
export async function batchRequests(requests, options = {}) {
  const {
    concurrency = 3,
    failFast = false
  } = options;

  if (!Array.isArray(requests)) {
    throw new Error('Requests must be an array');
  }

  const results = [];
  
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    
    try {
      if (failFast) {
        const batchResults = await Promise.all(batch.map(req => req()));
        results.push(...batchResults);
      } else {
        const batchResults = await Promise.allSettled(batch.map(req => req()));
        const processedResults = batchResults.map(result => 
          result.status === 'fulfilled' 
            ? result.value 
            : { success: false, error: result.reason?.message || 'Request failed' }
        );
        results.push(...processedResults);
      }
    } catch (error) {
      if (failFast) {
        throw error;
      }
      // Add error results for failed batch
      const errorResult = { success: false, error: error.message };
      results.push(...Array(batch.length).fill(errorResult));
    }
  }

  return results;
}

/**
 * Upload file helper
 * @param {File|Blob} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload response
 */
export async function uploadFile(file, options = {}) {
  const {
    endpoint = '/upload',
    onProgress,
    chunkSize = 1024 * 1024 // 1MB chunks
  } = options;

  const token = getStoredToken();
  if (!token) {
    return {
      success: false,
      error: ERROR_MESSAGES.TOKEN_EXPIRED
    };
  }

  // For small files, use regular upload
  if (file.size <= chunkSize) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return await processResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  // For large files, implement chunked upload
  return uploadFileChunked(file, { endpoint, onProgress, chunkSize, token });
}

/**
 * Chunked file upload for large files
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload response
 */
async function uploadFileChunked(file, options) {
  const { endpoint, onProgress, chunkSize, token } = options;
  
  const totalChunks = Math.ceil(file.size / chunkSize);
  let uploadedBytes = 0;

  try {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('chunkIndex', chunkIndex.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('filename', file.name);

      const response = await apiFetch(`${endpoint}/chunk`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await processResponse(response);
      if (!result.success) {
        throw new Error(result.error);
      }

      uploadedBytes += chunk.size;
      onProgress?.(uploadedBytes / file.size);
    }

    // Finalize upload
    const finalResponse = await apiFetch(`${endpoint}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ filename: file.name }),
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return await processResponse(finalResponse);
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Chunked upload failed'
    };
  }
}

/**
 * API request interceptor for adding common headers
 * @param {Object} config - Request configuration
 * @returns {Object} Modified configuration
 */
export function createRequestInterceptor(config = {}) {
  return (endpoint, options = {}) => {
    const modifiedOptions = {
      ...options,
      headers: {
        'X-Client-Version': '1.0.0',
        'X-Request-ID': generateRequestId(),
        ...config.headers,
        ...options.headers,
      }
    };

    return apiFetch(endpoint, modifiedOptions);
  };
}

/**
 * Generates unique request ID for tracking
 * @returns {string} Request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Export utility functions
export {
  apiFetch,
  processResponse,
  withRetry,
  batchRequests,
  uploadFile,
  createRequestInterceptor,
  generateRequestId
};

export default {
  authenticateWithZotok,
  getStoredUserToken,
  refreshUserToken,
  fetchProducts,
  fetchProductDetail,
  testZotokConnection,
  checkHealth,
  searchProducts,
  batchRequests,
  uploadFile
};