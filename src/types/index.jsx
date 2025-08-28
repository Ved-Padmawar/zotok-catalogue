// JavaScript constants and validation for Zotok Product Catalog App

// Product validation helper
export function validateProduct(product) {
  return {
    productName: product?.productName || '',
    skuCode: product?.skuCode || '',
    taxCategory: product?.taxCategory,
    packSize: product?.packSize,
    displayOrder: product?.displayOrder,
    grossWeight: product?.grossWeight,
    netWeight: product?.netWeight,
    mrp: product?.mrp,
    price: product?.price,
    ptr: product?.ptr,
    isEnabled: product?.isEnabled ?? true,
    caseSize: product?.caseSize,
    minOrderQuantity: product?.minOrderQuantity,
    maxOrderQuantity: product?.maxOrderQuantity,
    baseUnit: product?.baseUnit,
    quantityMultiplier: product?.quantityMultiplier,
    categoryCode: product?.categoryCode,
    categoryName: product?.categoryName,
    divisionCodes: product?.divisionCodes || [],
    divisionNames: product?.divisionNames || [],
    cfaCodes: product?.cfaCodes || [],
    cfaNames: product?.cfaNames || [],
    productImages: product?.productImages || [],
    id: product?.id || product?.skuCode,
    category: product?.category
  };
}

// Authentication validation helper
export function validateCredentials(credentials) {
  const errors = {};
  
  if (!credentials.workspaceId?.trim()) {
    errors.workspaceId = 'Workspace ID is required';
  }
  
  if (!credentials.clientId?.trim()) {
    errors.clientId = 'Client ID is required';
  }
  
  if (!credentials.clientSecret?.trim()) {
    errors.clientSecret = 'Client Secret is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// View state constants
export const VIEW_STATES = {
  AUTH: 'auth',
  LIST: 'list',
  DETAIL: 'detail'
};

// App state factory
export function createAppState(overrides = {}) {
  return {
    isAuthenticated: false,
    currentView: VIEW_STATES.AUTH,
    selectedProduct: null,
    currentPage: 1,
    isLoading: false,
    error: null,
    ...overrides
  };
}

// Pagination state factory
export function createPaginationState(overrides = {}) {
  return {
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
    ...overrides
  };
}