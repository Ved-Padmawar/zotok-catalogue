// Modern authentication service for Flask backend communication

import { 
  BACKEND_HOST, 
  API_ENDPOINTS, 
  HTTP_STATUS,
  ERROR_MESSAGES 
} from '../utils/constants.jsx';

/**
 * Authentication service with enhanced error handling and retry logic
 */
class AuthService {
  constructor() {
    this.baseURL = BACKEND_HOST;
    this.defaultTimeout = 10000; // 10 seconds
  }

  /**
   * Makes HTTP request with enhanced error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response object
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
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
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
    
    try {
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      });

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
          details: data.details || data.message
        };
      }

      return {
        success: true,
        ...data,
        status: response.status
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

      console.error('Auth API error:', error);
      
      return {
        success: false,
        error: this.getNetworkErrorMessage(error),
        status: 0,
        details: error.message
      };
    }
  }

  /**
   * Gets appropriate error message based on status code
   * @param {number} status - HTTP status code
   * @param {Object} data - Response data
   * @returns {string} Error message
   */
  getErrorMessage(status, data) {
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return data.error || 'Invalid request data';
      case HTTP_STATUS.UNAUTHORIZED:
        return ERROR_MESSAGES.AUTH_FAILED;
      case HTTP_STATUS.FORBIDDEN:
        return 'Access forbidden';
      case HTTP_STATUS.NOT_FOUND:
        return 'Service not found';
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
   * Authenticates user with Zotok credentials
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Authentication response
   */
  async login(credentials) {
    // Validate credentials
    if (!this.validateCredentials(credentials)) {
      return {
        success: false,
        error: ERROR_MESSAGES.INVALID_CREDENTIALS
      };
    }

    return this.makeRequest(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  /**
   * Retrieves stored token for user
   * @param {string} canvaUserId - Canva user ID
   * @returns {Promise<Object>} Token response
   */
  async getStoredToken(canvaUserId) {
    if (!canvaUserId) {
      return {
        success: false,
        error: 'User ID is required'
      };
    }

    const endpoint = `${API_ENDPOINTS.TOKEN}?canvaUserId=${encodeURIComponent(canvaUserId)}`;
    return this.makeRequest(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Refreshes expired token
   * @param {string} canvaUserId - Canva user ID
   * @returns {Promise<Object>} Refresh response
   */
  async refreshToken(canvaUserId) {
    if (!canvaUserId) {
      return {
        success: false,
        error: 'User ID is required'
      };
    }

    return this.makeRequest(API_ENDPOINTS.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ canvaUserId }),
    });
  }

  /**
   * Performs health check on authentication service
   * @returns {Promise<Object>} Health check response
   */
  async healthCheck() {
    return this.makeRequest(API_ENDPOINTS.HEALTH, {
      method: 'GET',
    });
  }

  /**
   * Tests CORS configuration
   * @returns {Promise<Object>} CORS test response
   */
  async testCors() {
    return this.makeRequest(API_ENDPOINTS.TEST_CORS, {
      method: 'GET',
    });
  }

  /**
   * Validates credentials object
   * @param {Object} credentials - Credentials to validate
   * @returns {boolean} Whether credentials are valid
   */
  validateCredentials(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      return false;
    }

    const required = ['workspaceId', 'clientId', 'clientSecret', 'canvaUserId'];
    return required.every(field => 
      credentials[field] && 
      typeof credentials[field] === 'string' && 
      credentials[field].trim().length > 0
    );
  }

  /**
   * Gets service configuration
   * @returns {Object} Service configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.defaultTimeout,
      endpoints: API_ENDPOINTS
    };
  }

  /**
   * Updates service configuration
   * @param {Object} config - Configuration updates
   */
  updateConfig(config = {}) {
    if (config.timeout && typeof config.timeout === 'number') {
      this.defaultTimeout = config.timeout;
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();

// Export class for testing
export { AuthService };

// Export individual methods for convenience
export const {
  login,
  getStoredToken,
  refreshToken,
  healthCheck,
  testCors
} = authService;

export default authService;