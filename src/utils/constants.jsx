// Enhanced constants for the new multi-view UI design

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  FEATURES: {
    ENABLE_ERROR_REPORTING: process.env.NODE_ENV === 'production',
    ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
    ENABLE_DEBUG_LOGS: process.env.NODE_ENV === 'development'
  }
};

// =============================================================================
// API CONFIGURATION
// =============================================================================

// Hardcoded backend URL - update this for production deployment
export const BACKEND_HOST = 'https://zotok-canva-backend-cehgbff0hudpb7ay.centralindia-01.azurewebsites.net'; // Change to your production URL

export const API_ENDPOINTS = {
  // Authentication endpoints
  LOGIN: '/auth/login',
  TOKEN: '/auth/token',
  REFRESH: '/auth/refresh',
  HEALTH: '/health',
  TEST_CORS: '/test-cors',
  
  // Product endpoints
  PRODUCTS: '/api/products',
  PRODUCT_DETAIL: '/api/products',
  TEST_ZOTOK: '/api/test-zotok',
  
  // User settings endpoint
  USER_SETTINGS: '/api/user/settings',
  
  // Image proxy endpoints
  PROXY_IMAGE: '/proxy/image',
  PROXY_IMAGE_BASE64: '/proxy/image/base64'
};

// =============================================================================
// APPLICATION CONFIGURATION
// =============================================================================

export const APP_CONFIG = {
  // UI Configuration for 360x1000 sidebar
  SIDEBAR_WIDTH: 360,
  SIDEBAR_HEIGHT: 1000,
  
  // Pagination
  PRODUCTS_PER_PAGE: 20,
  MAX_PRODUCTS_CACHE: 100,
  
  // Image configuration
  PRODUCT_IMAGE_SIZE: 56, // 56x56px for product list items
  DETAIL_IMAGE_SIZE: 80,  // 80x80px for detail view grid
  
  // Search configuration
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  
  // Performance
  REQUEST_TIMEOUT_MS: 15000,
  RETRY_ATTEMPTS: 3,
  
  // Theme
  DEFAULT_THEME: 'light',
  THEME_STORAGE_KEY: 'zotok-theme-preference'
};

// =============================================================================
// UI/UX CONFIGURATION
// =============================================================================

export const UI_CONFIG = {
  // Tab identifiers
  TABS: {
    PRODUCTS: 'products',
    SETTINGS: 'settings'
  },
  
  // View states
  VIEWS: {
    LOGIN: 'login',
    MAIN: 'main',
    DETAIL: 'detail'
  },
  
  // Animation durations (matches CSS)
  TRANSITIONS: {
    FAST: 150,
    NORMAL: 200,
    SLOW: 300
  },
  
  // Interactive feedback
  LOADING_DELAY_MS: 200,
  SUCCESS_MESSAGE_DURATION_MS: 3000,
  
  // Responsive breakpoints
  BREAKPOINTS: {
    MOBILE: 380,
    TABLET: 600,
    DESKTOP: 1024
  }
};

// =============================================================================
// VALIDATION RULES
// =============================================================================

export const VALIDATION = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 100,
  
  // Field-specific patterns
  WORKSPACE_ID: /^[a-zA-Z0-9-_]+$/,
  CLIENT_ID: /^[a-zA-Z0-9]+$/,
  
  // Settings validation
  PHONE_NUMBER: /^[\+]?[1-9][\d]{0,15}$/,
  
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128
};

// =============================================================================
// ERROR MESSAGES
// =============================================================================

export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_FAILED: 'Authentication failed. Please check your credentials.',
  INVALID_CREDENTIALS: 'Invalid credentials provided.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_REFRESH_FAILED: 'Failed to refresh token. Please log in again.',
  
  // Network errors
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  CONNECTION_TIMEOUT: 'Request timed out. Please try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  
  // Product errors
  PRODUCTS_LOAD_FAILED: 'Failed to load products. Please try again.',
  PRODUCT_DETAIL_FAILED: 'Failed to load product details. Please try again.',
  PRODUCT_SEARCH_FAILED: 'Search failed. Please try again.',
  
  // Drag and drop errors
  DRAG_FAILED: 'Failed to add item to design. Please try again.',
  IMAGE_UPLOAD_FAILED: 'Failed to upload image. Please try again.',
  
  // Settings errors
  SETTINGS_SAVE_FAILED: 'Failed to save settings. Please try again.',
  SETTINGS_LOAD_FAILED: 'Failed to load settings.',
  
  // General errors
  UNEXPECTED_ERROR: 'An unexpected error occurred.',
  FEATURE_NOT_SUPPORTED: 'This feature is not supported in the current context.',
  INVALID_INPUT: 'Invalid input provided.',
  
  // Offline errors
  OFFLINE_ERROR: 'You are offline. Please check your internet connection.'
};

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================

export const SUCCESS_MESSAGES = {
  AUTH_SUCCESS: 'Successfully connected to Zotok.',
  SETTINGS_SAVED: 'Settings saved successfully.',
  PRODUCT_ADDED: 'Product added to design.',
  ELEMENT_ADDED: 'Element added to design.',
  CONNECTION_RESTORED: 'Connection restored.'
};

// =============================================================================
// LOADING MESSAGES
// =============================================================================

export const LOADING_MESSAGES = {
  LOADING_APP: 'Initializing Zotok Browser...',
  LOADING_PRODUCTS: 'Loading products...',
  LOADING_PRODUCT_DETAIL: 'Loading product details...',
  CONNECTING: 'Connecting to Zotok...',
  SAVING_SETTINGS: 'Saving settings...',
  ADDING_TO_DESIGN: 'Adding to design...',
  UPLOADING_IMAGE: 'Uploading image...',
  REFRESHING_TOKEN: 'Refreshing session...'
};

// =============================================================================
// PERFORMANCE CONFIGURATION
// =============================================================================

export const PERFORMANCE = {
  DEBOUNCE_SEARCH_MS: 300,
  DEBOUNCE_RESIZE_MS: 150,
  CACHE_EXPIRY_MS: 5 * 60 * 1000, // 5 minutes
  IMAGE_LOAD_TIMEOUT_MS: 10000,
  RETRY_DELAY_MS: 1000,
  
  // Virtualization thresholds
  VIRTUAL_LIST_THRESHOLD: 50,
  IMAGE_LAZY_LOAD_THRESHOLD: 100,
  
  // Memory management
  MAX_CACHED_IMAGES: 50,
  MAX_SEARCH_HISTORY: 10
};

// =============================================================================
// DRAG AND DROP CONFIGURATION
// =============================================================================

export const DRAG_CONFIG = {
  // Image sizes for upload
  IMAGE_PREVIEW_SIZE: {
    width: 120,
    height: 120
  },
  IMAGE_FULL_SIZE: {
    width: 800,
    height: 600
  },
  
  // Drag feedback
  DRAG_OPACITY: 0.8,
  DRAG_SCALE: 0.95,
  
  // Drop zones
  DROP_ZONE_HIGHLIGHT_COLOR: '#8a3ffc',
  DROP_ZONE_ACTIVE_COLOR: '#7c3aed'
};

export const DESIGN_CONFIG = {
  ALT_TEXT_PREFIX: 'Zotok Product: ',
  DEFAULT_TEXT_SIZE: 16,
  DEFAULT_TEXT_COLOR: '#000000',
  
  // Element positioning
  DEFAULT_ELEMENT_POSITION: {
    x: 100,
    y: 100
  }
};

export const CONTENT_SUPPORT = {
  startDragToPoint: ['text', 'image', 'video', 'audio', 'embed'],
  startDragToCursor: ['image', 'video', 'embed'],
  addElementAtPoint: ['text', 'image', 'video', 'audio', 'embed'],
  addElementAtCursor: ['text', 'image', 'video', 'audio', 'embed']
};

// =============================================================================
// HTTP STATUS CODES
// =============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// =============================================================================
// TOKEN CONFIGURATION
// =============================================================================

export const TOKEN_CONFIG = {
  STORAGE_KEY: 'zotok_login_token',
  EXPIRY_KEY: 'zotok_token_expiry',
  USER_ID_KEY: 'zotok_user_id',
  
  // Token expiry (28 days in milliseconds)
  EXPIRY_MS: 28 * 24 * 60 * 60 * 1000,
  
  // Warning thresholds
  WARNING_THRESHOLD_HOURS: 24,
  REFRESH_THRESHOLD_HOURS: 1
};

// =============================================================================
// CURRENCY CONFIGURATION
// =============================================================================

export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR',
  DECIMAL_PLACES: 2,
  THOUSAND_SEPARATOR: ',',
  DECIMAL_SEPARATOR: '.'
};

// =============================================================================
// IMAGE CONFIGURATION
// =============================================================================

export const IMAGE_CONFIG = {
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  MAX_FILE_SIZE_MB: 10,
  COMPRESSION_QUALITY: 0.8,
  LAZY_LOAD_THRESHOLD: 50,
  
  // Fallback configurations
  PLACEHOLDER_COLORS: [
    '#8a3ffc', '#7c3aed', '#6366f1', '#3b82f6', 
    '#06b6d4', '#10b981', '#84cc16', '#eab308'
  ],
  
  // Error handling
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000
};

// =============================================================================
// ANALYTICS CONFIGURATION
// =============================================================================

export const ANALYTICS = {
  EVENTS: {
    APP_LOADED: 'app_loaded',
    USER_AUTHENTICATED: 'user_authenticated',
    PRODUCT_VIEWED: 'product_viewed',
    PRODUCT_ADDED_TO_DESIGN: 'product_added_to_design',
    SEARCH_PERFORMED: 'search_performed',
    SETTINGS_UPDATED: 'settings_updated',
    ERROR_OCCURRED: 'error_occurred'
  },
  
  // Sampling rates
  ERROR_SAMPLING_RATE: 1.0,
  PERFORMANCE_SAMPLING_RATE: 0.1,
  USER_INTERACTION_SAMPLING_RATE: 0.5
};

// =============================================================================
// ACCESSIBILITY CONFIGURATION
// =============================================================================

export const A11Y_CONFIG = {
  // Focus management
  FOCUS_VISIBLE_OUTLINE: '2px solid #8a3ffc',
  FOCUS_VISIBLE_OFFSET: '2px',
  
  // Color contrast ratios
  MIN_CONTRAST_RATIO: 4.5,
  MIN_CONTRAST_RATIO_LARGE: 3.0,
  
  // Screen reader announcements
  ARIA_LIVE_REGIONS: {
    POLITE: 'polite',
    ASSERTIVE: 'assertive'
  },
  
  // Keyboard navigation
  TAB_INDEX_INTERACTIVE: 0,
  TAB_INDEX_PROGRAMMATIC: -1
};

// =============================================================================
// PRODUCT CATEGORIES (for filtering/organization)
// =============================================================================

export const PRODUCT_CATEGORIES = {
  ALL: 'all',
  FEATURED: 'featured',
  NEW: 'new',
  SALE: 'sale',
  FAVORITES: 'favorites'
};

// =============================================================================
// THEME CONFIGURATION
// =============================================================================

export const THEME_CONFIG = {
  MODES: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto'
  },
  
  // Storage
  PREFERENCE_KEY: 'zotok-theme-preference',
  
  // Detection
  MEDIA_QUERY: '(prefers-color-scheme: dark)',
  DETECTION_INTERVAL_MS: 2000,
  
  // Transition
  TRANSITION_DURATION_MS: 200,
  TRANSITION_CLASS: 'theme-transitioning'
};

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

export const DEV_CONFIG = {
  // Debug flags
  LOG_API_REQUESTS: ENV.isDevelopment,
  LOG_PERFORMANCE: ENV.isDevelopment,
  LOG_USER_INTERACTIONS: ENV.isDevelopment,
  
  // Mock data
  USE_MOCK_DATA: false,
  MOCK_DELAY_MS: 500,
  
  // Testing
  TEST_MODE: process.env.NODE_ENV === 'test'
};

// =============================================================================
// EXPORT GROUPS FOR CONVENIENCE
// =============================================================================

export const CONFIGS = {
  APP: APP_CONFIG,
  UI: UI_CONFIG,
  DRAG: DRAG_CONFIG,
  DESIGN: DESIGN_CONFIG,
  TOKEN: TOKEN_CONFIG,
  IMAGE: IMAGE_CONFIG,
  THEME: THEME_CONFIG,
  PERFORMANCE,
  A11Y: A11Y_CONFIG
};

export const MESSAGES = {
  ERROR: ERROR_MESSAGES,
  SUCCESS: SUCCESS_MESSAGES,
  LOADING: LOADING_MESSAGES
};

// Default export for backward compatibility
export default {
  ENV,
  BACKEND_HOST,
  API_ENDPOINTS,
  APP_CONFIG,
  UI_CONFIG,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_MESSAGES,
  PERFORMANCE,
  DRAG_CONFIG,
  DESIGN_CONFIG,
  CONTENT_SUPPORT,
  HTTP_STATUS,
  TOKEN_CONFIG,
  CURRENCY,
  IMAGE_CONFIG,
  ANALYTICS,
  A11Y_CONFIG,
  PRODUCT_CATEGORIES,
  THEME_CONFIG,
  DEV_CONFIG
};