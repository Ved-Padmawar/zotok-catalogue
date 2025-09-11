// Modern authentication utilities with secure in-memory token management

import { TOKEN_CONFIG } from './constants.jsx';

/**
 * In-memory storage manager for secure token handling
 * Tokens are cleared on page reload, requiring refetch from backend
 */
class StorageManager {
  constructor() {
    // Always use in-memory storage to prevent token persistence
    this.storage = new MemoryStorage();
  }

  setItem(key, value) {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to set storage item:', error);
    }
  }

  getItem(key) {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.warn('Failed to get storage item:', error);
      return null;
    }
  }

  removeItem(key) {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove storage item:', error);
    }
  }

  clear() {
    try {
      // Clear all our token-related keys
      const keysToRemove = [
        TOKEN_CONFIG.STORAGE_KEY,
        TOKEN_CONFIG.USER_ID_KEY,
        TOKEN_CONFIG.EXPIRY_KEY
      ];
      keysToRemove.forEach(key => this.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }
}

/**
 * Memory storage fallback for environments without persistent storage
 */
class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  setItem(key, value) {
    this.data.set(key, value);
  }

  getItem(key) {
    return this.data.get(key) || null;
  }

  removeItem(key) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }
}

// Initialize storage manager
const storage = new StorageManager();

/**
 * Encrypts sensitive data (basic obfuscation)
 * @param {string} data - Data to encrypt
 * @returns {string} Encrypted data
 */
function encryptData(data) {
  if (!data) return data;
  
  try {
    // Simple base64 encoding with some obfuscation
    const encoded = btoa(unescape(encodeURIComponent(data)));
    const obfuscated = encoded.split('').reverse().join('');
    return obfuscated;
  } catch (error) {
    console.warn('Encryption failed:', error);
    return data;
  }
}

/**
 * Decrypts data encrypted with encryptData
 * @param {string} encryptedData - Encrypted data
 * @returns {string} Decrypted data
 */
function decryptData(encryptedData) {
  if (!encryptedData) return encryptedData;
  
  try {
    // Reverse the obfuscation
    const reversed = encryptedData.split('').reverse().join('');
    const decoded = decodeURIComponent(escape(atob(reversed)));
    return decoded;
  } catch (error) {
    console.warn('Decryption failed:', error);
    return encryptedData;
  }
}

/**
 * Stores authentication token with enhanced security
 * @param {string} token - Authentication token
 * @param {string} canvaUserId - Canva user ID
 * @param {Object} options - Storage options
 */
export function storeToken(token, canvaUserId, options = {}) {
  if (!token || !canvaUserId) {
    console.warn('Token and user ID are required for storage');
    return;
  }

  const {
    encrypt = true,
    customExpiry = null
  } = options;

  try {
    const expiryTime = customExpiry || (Date.now() + TOKEN_CONFIG.EXPIRY_MS);
    
    // Store token (with optional encryption)
    const tokenToStore = encrypt ? encryptData(token) : token;
    storage.setItem(TOKEN_CONFIG.STORAGE_KEY, tokenToStore);
    
    // Store user ID
    storage.setItem(TOKEN_CONFIG.USER_ID_KEY, canvaUserId);
    
    // Store expiry time
    storage.setItem(TOKEN_CONFIG.EXPIRY_KEY, expiryTime.toString());
    
    // Store encryption flag
    storage.setItem(`${TOKEN_CONFIG.STORAGE_KEY}_encrypted`, encrypt.toString());
    
    console.log('Token stored successfully');
  } catch (error) {
    console.error('Failed to store token:', error);
  }
}

/**
 * Retrieves stored authentication token if valid
 * @param {Object} options - Retrieval options
 * @returns {string|null} Token or null if invalid/expired
 */
export function getStoredToken(options = {}) {
  const { 
    skipExpiryCheck = false,
    decrypt = true 
  } = options;

  try {
    const token = storage.getItem(TOKEN_CONFIG.STORAGE_KEY);
    const expiryTime = storage.getItem(TOKEN_CONFIG.EXPIRY_KEY);
    const isEncrypted = storage.getItem(`${TOKEN_CONFIG.STORAGE_KEY}_encrypted`) === 'true';
    
    if (!token || (!skipExpiryCheck && !expiryTime)) {
      return null;
    }
    
    // Check if token has expired
    if (!skipExpiryCheck && Date.now() > parseInt(expiryTime, 10)) {
      clearTokenStorage();
      return null;
    }
    
    // Decrypt token if needed
    if (decrypt && isEncrypted) {
      return decryptData(token);
    }
    
    return token;
  } catch (error) {
    console.warn('Failed to retrieve token:', error);
    return null;
  }
}

/**
 * Gets stored Canva user ID
 * @returns {string|null} User ID or null
 */
export function getStoredUserId() {
  try {
    return storage.getItem(TOKEN_CONFIG.USER_ID_KEY);
  } catch (error) {
    console.warn('Failed to retrieve user ID:', error);
    return null;
  }
}

/**
 * Checks if current stored token is valid and not expired
 * @returns {boolean} Whether token is valid
 */
export function isTokenValid() {
  try {
    const token = storage.getItem(TOKEN_CONFIG.STORAGE_KEY);
    const expiryTime = storage.getItem(TOKEN_CONFIG.EXPIRY_KEY);
    
    if (!token || !expiryTime) {
      return false;
    }
    
    return Date.now() < parseInt(expiryTime, 10);
  } catch (error) {
    console.warn('Failed to check token validity:', error);
    return false;
  }
}

/**
 * Clears all stored authentication data
 */
export function clearTokenStorage() {
  try {
    storage.removeItem(TOKEN_CONFIG.STORAGE_KEY);
    storage.removeItem(TOKEN_CONFIG.USER_ID_KEY);
    storage.removeItem(TOKEN_CONFIG.EXPIRY_KEY);
    storage.removeItem(`${TOKEN_CONFIG.STORAGE_KEY}_encrypted`);
    
    console.log('Token storage cleared');
  } catch (error) {
    console.warn('Failed to clear token storage:', error);
  }
}

/**
 * Gets token expiry time in readable format
 * @returns {string|null} Formatted expiry time or null
 */
export function getTokenExpiryTime() {
  try {
    const expiryTime = storage.getItem(TOKEN_CONFIG.EXPIRY_KEY);
    
    if (!expiryTime) {
      return null;
    }
    
    const expiryDate = new Date(parseInt(expiryTime, 10));
    return expiryDate.toLocaleString();
  } catch (error) {
    console.warn('Failed to get token expiry time:', error);
    return null;
  }
}

/**
 * Gets remaining time until token expires
 * @returns {number} Remaining time in milliseconds
 */
export function getTokenTimeRemaining() {
  try {
    const expiryTime = storage.getItem(TOKEN_CONFIG.EXPIRY_KEY);
    
    if (!expiryTime) {
      return 0;
    }
    
    const remaining = parseInt(expiryTime, 10) - Date.now();
    return Math.max(0, remaining);
  } catch (error) {
    console.warn('Failed to get token time remaining:', error);
    return 0;
  }
}

/**
 * Checks if token will expire within specified hours
 * @param {number} hoursThreshold - Hours threshold for warning
 * @returns {boolean} Whether token expires soon
 */
export function willTokenExpireSoon(hoursThreshold = 24) {
  try {
    const remaining = getTokenTimeRemaining();
    const thresholdMs = hoursThreshold * 60 * 60 * 1000;
    
    return remaining <= thresholdMs && remaining > 0;
  } catch (error) {
    console.warn('Failed to check if token expires soon:', error);
    return true; // Assume it expires soon if we can't check
  }
}

/**
 * Updates token expiry time (for refresh scenarios)
 * @param {number} newExpiryMs - New expiry time in milliseconds
 */
export function updateTokenExpiry(newExpiryMs) {
  try {
    if (!newExpiryMs || newExpiryMs <= Date.now()) {
      console.warn('Invalid expiry time provided');
      return;
    }
    
    storage.setItem(TOKEN_CONFIG.EXPIRY_KEY, newExpiryMs.toString());
  } catch (error) {
    console.warn('Failed to update token expiry:', error);
  }
}

/**
 * Gets comprehensive token information
 * @returns {Object} Token information object
 */
export function getTokenInfo() {
  try {
    const token = getStoredToken({ skipExpiryCheck: true, decrypt: false });
    const userId = getStoredUserId();
    const expiryTime = storage.getItem(TOKEN_CONFIG.EXPIRY_KEY);
    const isEncrypted = storage.getItem(`${TOKEN_CONFIG.STORAGE_KEY}_encrypted`) === 'true';
    
    return {
      hasToken: !!token,
      isValid: isTokenValid(),
      userId,
      expiryTime: expiryTime ? new Date(parseInt(expiryTime, 10)) : null,
      timeRemaining: getTokenTimeRemaining(),
      willExpireSoon: willTokenExpireSoon(24),
      isEncrypted,
      storage: 'MemoryStorage' // Always in-memory now
    };
  } catch (error) {
    console.warn('Failed to get token info:', error);
    return {
      hasToken: false,
      isValid: false,
      userId: null,
      expiryTime: null,
      timeRemaining: 0,
      willExpireSoon: true,
      isEncrypted: false,
      storage: 'unknown'
    };
  }
}

/**
 * Validates token format and structure
 * @param {string} token - Token to validate
 * @returns {Object} Validation result
 */
export function validateTokenFormat(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token must be a non-empty string' };
  }

  // Basic JWT format check (header.payload.signature)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Token does not appear to be a valid JWT' };
  }

  try {
    // Try to decode the payload (basic validation)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check for required fields
    if (!payload.exp) {
      return { valid: false, error: 'Token missing expiration claim' };
    }
    
    // Check if token is expired according to its internal exp claim
    if (payload.exp * 1000 < Date.now()) {
      return { valid: false, error: 'Token is expired according to its exp claim' };
    }
    
    return { 
      valid: true, 
      payload,
      expiresAt: new Date(payload.exp * 1000),
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : null
    };
  } catch (error) {
    return { valid: false, error: 'Failed to decode token payload' };
  }
}

/**
 * Creates a token refresh reminder
 * @param {Function} callback - Callback to execute when reminder triggers
 * @param {number} hoursBeforeExpiry - Hours before expiry to trigger reminder
 * @returns {Function} Cleanup function
 */
export function createTokenRefreshReminder(callback, hoursBeforeExpiry = 24) {
  if (typeof callback !== 'function') {
    console.warn('Callback must be a function');
    return () => {};
  }

  const checkInterval = 60 * 60 * 1000; // Check every hour
  let hasReminded = false;

  const intervalId = setInterval(() => {
    if (!hasReminded && willTokenExpireSoon(hoursBeforeExpiry)) {
      hasReminded = true;
      callback();
    }
    
    // Reset reminder if token was refreshed
    if (!willTokenExpireSoon(hoursBeforeExpiry)) {
      hasReminded = false;
    }
  }, checkInterval);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

/**
 * Secure logout function that clears all traces
 */
export function secureLogout() {
  try {
    // Clear in-memory token storage
    clearTokenStorage();
    
    console.log('Secure logout completed - all tokens cleared from memory');
  } catch (error) {
    console.warn('Error during secure logout:', error);
  }
}

// Export storage manager for advanced use cases
export { StorageManager, MemoryStorage };

export default {
  storeToken,
  getStoredToken,
  getStoredUserId,
  isTokenValid,
  clearTokenStorage,
  getTokenExpiryTime,
  getTokenTimeRemaining,
  willTokenExpireSoon,
  updateTokenExpiry,
  getTokenInfo,
  validateTokenFormat,
  createTokenRefreshReminder,
  secureLogout
};