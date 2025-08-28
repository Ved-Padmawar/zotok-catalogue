// Type definitions for the Zotok Product Browser

export interface Product {
  productName?: string;
  skuCode?: string;
  taxCategory?: string;
  packSize?: string;
  displayOrder?: string | number;
  grossWeight?: string;
  netWeight?: string;
  mrp?: string | number;
  price?: string | number;
  ptr?: string | number;
  isEnabled?: boolean | string;
  caseSize?: string | number;
  minOrderQuantity?: string | number;
  maxOrderQuantity?: string | number;
  baseUnit?: string;
  quantityMultiplier?: string | number;
  categoryCode?: string;
  categoryName?: string;
  divisionCodes?: string;
  divisionNames?: string;
  cfaCodes?: string;
  cfaNames?: string;
  productImages?: string | string[];
}

export interface AuthCredentials {
  workspaceId: string;
  clientId: string;
  clientSecret: string;
}

export interface UserData {
  canva_user_id: string;
  workspace_id: string;
  client_id: string;
  client_secret: string;
  login_token: string;
  token_timestamp: string;
  token_expires_in: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

export interface ProductsApiResponse {
  products: Product[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

// Canva SDK related types
export type CanvaUserToken = string;

export interface DragData {
  type: string;
  children?: string[];
  url?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  color?: string;
}

// Component props interfaces
export interface AuthFormProps {
  onAuthSuccess: (credentials: AuthCredentials) => void;
  error: string;
}

export interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export interface ProductListProps {
  authToken: string;
  onProductSelect: (product: Product) => void;
  onTokenExpired: () => Promise<boolean>;
}

export interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  authToken: string;
  onTokenExpired: () => Promise<boolean>;
}

// API service interfaces
export interface ProductsParams {
  page?: number;
  limit?: number;
  period?: number;
  search?: string;
  category?: string;
}

export interface LoginRequest {
  workspaceId: string;
  clientId: string;
  clientSecret: string;
  canvaUserId: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
  error?: string;
  details?: string;
}

// App state types
export type AppState = "loading" | "auth" | "products" | "product-detail";

// Environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CANVA_APP_ID: string;
      CANVA_APP_ORIGIN: string;
      CANVA_BACKEND_HOST: string;
    }
  }
}
