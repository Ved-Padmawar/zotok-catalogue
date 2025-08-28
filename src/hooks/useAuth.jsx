// Modern authentication hook with 28-day token management

import { useState, useEffect, useCallback, useRef } from 'react';
import { auth } from '@canva/user';
import { 
  authenticateWithZotok, 
  getStoredUserToken, 
  refreshUserToken 
} from '../utils/api.jsx';
import { 
  storeToken, 
  getStoredToken, 
  getStoredUserId,
  isTokenValid, 
  clearTokenStorage,
  willTokenExpireSoon 
} from '../utils/auth.jsx';
import { 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  TOKEN_CONFIG 
} from '../utils/constants.jsx';

/**
 * Modern authentication hook with comprehensive token management
 * @returns {Object} Authentication state and methods
 */
export function useAuth() {
  // State management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canvaUserId, setCanvaUserId] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  
  // Refs for cleanup
  const refreshIntervalRef = useRef(null);
  const isCheckingAuth = useRef(false);

  /**
   * Gets Canva user token for identification
   * @returns {Promise<string|null>} User ID or null
   */
  const getCanvaUserId = useCallback(async () => {
    try {
      const canvaUserToken = await auth.getCanvaUserToken();
      // In production, decode JWT to get actual user ID
      // For now, use token hash as identifier
      return canvaUserToken ? btoa(canvaUserToken).slice(0, 32) : null;
    } catch (error) {
      console.error('Failed to get Canva user token:', error);
      return null;
    }
  }, []);

  /**
   * Sets up automatic token refresh
   */
  const setupTokenRefresh = useCallback(() => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Check token status every hour
    refreshIntervalRef.current = setInterval(async () => {
      if (isAuthenticated && willTokenExpireSoon(24)) {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Auto refresh failed:', error);
          logout();
        }
      }
    }, 60 * 60 * 1000); // 1 hour
  }, [isAuthenticated]);

  /**
   * Checks authentication status on mount and validates token
   */
  const checkAuthStatus = useCallback(async () => {
    if (isCheckingAuth.current) return;
    
    isCheckingAuth.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Get Canva user ID
      const userId = await getCanvaUserId();
      if (!userId) {
        setIsAuthenticated(false);
        setCanvaUserId(null);
        return;
      }

      setCanvaUserId(userId);

      // Check if we have a valid stored token
      if (isTokenValid()) {
        setIsAuthenticated(true);
        setTokenExpiry(new Date(Date.now() + TOKEN_CONFIG.EXPIRY_MS));
        setupTokenRefresh();
        return;
      }

      // Try to get existing token from backend
      const storedUserId = getStoredUserId();
      if (storedUserId && storedUserId === userId) {
        const tokenResponse = await getStoredUserToken(storedUserId);
        
        if (tokenResponse.success && tokenResponse.token) {
          storeToken(tokenResponse.token, storedUserId);
          setIsAuthenticated(true);
          setTokenExpiry(new Date(Date.now() + TOKEN_CONFIG.EXPIRY_MS));
          setupTokenRefresh();
          return;
        }
      }

      // No valid token found
      setIsAuthenticated(false);
      clearTokenStorage();
      
    } catch (error) {
      console.error('Auth status check failed:', error);
      setError(ERROR_MESSAGES.AUTH_FAILED);
      setIsAuthenticated(false);
      clearTokenStorage();
    } finally {
      setIsLoading(false);
      isCheckingAuth.current = false;
    }
  }, [getCanvaUserId, setupTokenRefresh]);

  /**
   * Authenticates user with credentials
   * @param {Object} credentials - Zotok credentials
   * @returns {Promise<boolean>} Success status
   */
  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get Canva user ID first
      const userId = await getCanvaUserId();
      if (!userId) {
        setError('Unable to identify Canva user');
        return false;
      }

      // Authenticate with backend
      const response = await authenticateWithZotok(credentials, userId);
      
      if (response.success && response.token) {
        storeToken(response.token, userId);
        setIsAuthenticated(true);
        setCanvaUserId(userId);
        setTokenExpiry(new Date(Date.now() + TOKEN_CONFIG.EXPIRY_MS));
        setError(null);
        setupTokenRefresh();
        return true;
      } else {
        setError(response.error || ERROR_MESSAGES.AUTH_FAILED);
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : ERROR_MESSAGES.AUTH_FAILED);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getCanvaUserId, setupTokenRefresh]);

  /**
   * Refreshes authentication token
   * @returns {Promise<boolean>} Success status
   */
  const refreshToken = useCallback(async () => {
    const userId = getStoredUserId();
    if (!userId) {
      return false;
    }

    try {
      const response = await refreshUserToken(userId);
      
      if (response.success && response.token) {
        storeToken(response.token, userId);
        setIsAuthenticated(true);
        setTokenExpiry(new Date(Date.now() + TOKEN_CONFIG.EXPIRY_MS));
        return true;
      } else {
        clearTokenStorage();
        setIsAuthenticated(false);
        setTokenExpiry(null);
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearTokenStorage();
      setIsAuthenticated(false);
      setTokenExpiry(null);
      return false;
    }
  }, []);

  /**
   * Logs out user and clears all auth data
   */
  const logout = useCallback(() => {
    // Clear token refresh interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    clearTokenStorage();
    setIsAuthenticated(false);
    setCanvaUserId(null);
    setTokenExpiry(null);
    setError(null);
  }, []);

  /**
   * Gets current token status
   * @returns {Object} Token status information
   */
  const getTokenStatus = useCallback(() => {
    const token = getStoredToken();
    const userId = getStoredUserId();
    
    return {
      hasToken: !!token,
      isValid: isTokenValid(),
      willExpireSoon: willTokenExpireSoon(24),
      userId,
      expiry: tokenExpiry
    };
  }, [tokenExpiry]);

  /**
   * Validates current session
   * @returns {Promise<boolean>} Whether session is valid
   */
  const validateSession = useCallback(async () => {
    if (!isAuthenticated) return false;

    try {
      // If token will expire soon, refresh it
      if (willTokenExpireSoon(1)) {
        return await refreshToken();
      }

      return isTokenValid();
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }, [isAuthenticated, refreshToken]);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Auto-refresh token if expiring soon
  useEffect(() => {
    if (isAuthenticated && willTokenExpireSoon(24)) {
      refreshToken().catch(error => {
        console.error('Auto refresh failed:', error);
      });
    }
  }, [isAuthenticated, refreshToken]);

  return {
    // State
    isAuthenticated,
    isLoading,
    error,
    canvaUserId,
    tokenExpiry,
    
    // Actions
    login,
    logout,
    refreshToken,
    checkAuthStatus,
    validateSession,
    
    // Utilities
    getTokenStatus,
    clearError: () => setError(null)
  };
}

/**
 * Hook for checking authentication status without full auth context
 * @returns {Object} Minimal auth status
 */
export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const hasValidToken = isTokenValid();
        setIsAuthenticated(hasValidToken);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  return { isAuthenticated, isLoading };
}

/**
 * Hook for token expiry notifications
 * @param {number} warningHours - Hours before expiry to start warning
 * @returns {Object} Expiry status and handlers
 */
export function useTokenExpiry(warningHours = 24) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    const checkExpiry = () => {
      if (!isTokenValid()) {
        setShowWarning(false);
        setTimeRemaining(null);
        return;
      }

      const willExpire = willTokenExpireSoon(warningHours);
      setShowWarning(willExpire);

      if (willExpire) {
        // Calculate remaining time
        const expiryTime = sessionStorage.getItem(TOKEN_CONFIG.EXPIRY_KEY);
        if (expiryTime) {
          const remaining = parseInt(expiryTime) - Date.now();
          setTimeRemaining(Math.max(0, remaining));
        }
      }
    };

    // Check immediately
    checkExpiry();

    // Check every minute
    const interval = setInterval(checkExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [warningHours]);

  return {
    showWarning,
    timeRemaining,
    dismissWarning: () => setShowWarning(false)
  };
}

export default useAuth;