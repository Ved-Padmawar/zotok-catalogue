import { useState, useEffect } from "react";
import { AppUiProvider } from "@canva/app-ui-kit";
import { auth } from "@canva/user";
import AuthForm from "./components/AuthForm.jsx";
import ProductList from "./components/ProductList.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import { authService } from "./services/authApi.jsx";
import { BACKEND_HOST } from "./utils/constants.jsx";
import type { Product } from "./types";

const retryRequest = async (
  requestFn: () => Promise<any>,
  maxRetries = 3,
  delay = 2000,
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      console.warn(`Request attempt ${i + 1} failed:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

type AppView = "login" | "main" | "detail";
type ActiveTab = "products" | "settings";

export const App = () => {
  const [currentView, setCurrentView] = useState<AppView>("login");
  const [activeTab, setActiveTab] = useState<ActiveTab>("products");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [canvaUserId, setCanvaUserId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [authError, setAuthError] = useState<string>("");
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(false);
  const [settingsMessage, setSettingsMessage] = useState<string>("");
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);
  const [tempPhoneNumber, setTempPhoneNumber] = useState<string>("");

  // Proper Canva SDK v2 theme detection using design tokens
  useEffect(() => {
    const detectCanvaTheme = () => {
      // Wait for AppUiProvider to load Canva's design tokens
      const canvas = getComputedStyle(document.documentElement).getPropertyValue('--ui-kit-color-canvas').trim();
      
      if (canvas) {
        // Parse the CSS color value to determine if it's light or dark
        let theme = 'light';
        
        // Check if it's an RGB/RGBA value
        if (canvas.includes('rgb')) {
          const match = canvas.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            // Calculate luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            theme = luminance > 0.5 ? 'light' : 'dark';
          }
        }
        // Check if it's a hex value
        else if (canvas.startsWith('#')) {
          const hex = canvas.slice(1);
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          theme = luminance > 0.5 ? 'light' : 'dark';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
      } else {
        // AppUiProvider hasn't loaded design tokens yet, retry
        setTimeout(detectCanvaTheme, 100);
      }
    };

    // Initial detection after a short delay to allow AppUiProvider to initialize
    const timer = setTimeout(detectCanvaTheme, 200);

    // Watch for changes in CSS custom properties
    const observer = new MutationObserver(() => {
      detectCanvaTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    initializeApp();
  }, []);


  const initializeApp = async () => {
    try {
      console.log("🚀 Initializing Zotok Product Browser...");

      const userToken = await auth.getCanvaUserToken();
      if (userToken) {
        // Create a simple hash-based user ID from the token
        const userId = btoa(userToken).slice(0, 32);

        setCanvaUserId(userId);

        // Check for stored token in sessionStorage first (faster)
        const storedToken = sessionStorage.getItem("zotok_login_token");
        if (storedToken) {
          console.log("📱 Using cached session token");
          setAuthToken(storedToken);
          setCurrentView("main");
          await loadUserSettings(userId);
          return;
        }

        // Check backend for stored token
        console.log("🔍 Checking for stored token...");
        const tokenResponse = await retryRequest(() =>
          authService.getStoredToken(userId),
        );
        if (tokenResponse.success && tokenResponse.token) {
          console.log("💾 Found stored token");
          setAuthToken(tokenResponse.token);
          sessionStorage.setItem("zotok_login_token", tokenResponse.token);
          setCurrentView("main");
          await loadUserSettings(userId);
        } else {
          console.log("🔐 No valid token found, showing auth");
          setCurrentView("login");
        }
      } else {
        console.warn("⚠️ No Canva user token available");
        setCurrentView("login");
      }
    } catch (error) {
      console.error("💥 Error initializing app:", error);
      setCurrentView("login");
    }
  };

  const loadUserSettings = async (userId: string) => {
    try {
      const response = await fetch(
        `${BACKEND_HOST}/api/user/settings?canvaUserId=${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken || sessionStorage.getItem("zotok_login_token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.phoneNumber) {
          setPhoneNumber(data.phoneNumber);
          setTempPhoneNumber(data.phoneNumber);
        } else {
          setPhoneNumber("");
          setTempPhoneNumber("");
        }
      } else {
        console.warn("Settings response not ok:", response.status);
      }
    } catch (error) {
      console.warn("📱 Could not load user settings:", error);
    }
  };

  const handleAuthSuccess = async (credentials: {
    workspaceId: string;
    clientId: string;
    clientSecret: string;
  }) => {
    try {
      console.log("🔑 Attempting authentication...");
      setAuthError("");

      const response = await authService.login({
        ...credentials,
        canvaUserId,
      });

      if (response.success && response.token) {
        console.log("✅ Authentication successful");
        setAuthToken(response.token);
        sessionStorage.setItem("zotok_login_token", response.token);
        setCurrentView("main");
        await loadUserSettings(canvaUserId);
      } else {
        console.error("❌ Authentication failed:", response.error);
        setAuthError(response.error || "Authentication failed");
      }
    } catch (error) {
      console.error("💥 Authentication error:", error);
      setAuthError("Network error during authentication");
    }
  };

  const handleLogout = () => {
    console.log("👋 Logging out...");
    setAuthToken(null);
    sessionStorage.removeItem("zotok_login_token");
    setCurrentView("login");
    setAuthError("");
    setSelectedProduct(null);
    setActiveTab("products");
    setPhoneNumber("");
    setTempPhoneNumber("");
    setIsEditingPhone(false);
    setSettingsMessage("");
  };

  const handleProductSelect = (product: Product) => {
    console.log("📦 Product selected:", product.productName);
    setSelectedProduct(product);
    setCurrentView("detail");
  };

  const handleBackToMain = () => {
    console.log("⬅️ Returning to main view");
    setSelectedProduct(null);
    setCurrentView("main");
  };

  const handleTokenExpired = async (): Promise<boolean> => {
    try {
      console.log("🔄 Attempting token refresh...");
      const response = await authService.refreshToken(canvaUserId);
      if (response.success && response.token) {
        console.log("✅ Token refreshed successfully");
        setAuthToken(response.token);
        sessionStorage.setItem("zotok_login_token", response.token);
        return true;
      } else {
        console.warn("❌ Token refresh failed, logging out");
        handleLogout();
        return false;
      }
    } catch (error) {
      console.error("💥 Token refresh error:", error);
      handleLogout();
      return false;
    }
  };


  const handleEditPhone = () => {
    setIsEditingPhone(true);
    setTempPhoneNumber(phoneNumber);
    setSettingsMessage("");
  };

  const handleCancelEdit = () => {
    setIsEditingPhone(false);
    setTempPhoneNumber(phoneNumber);
    setSettingsMessage("");
  };

  const saveSettings = async () => {
    if (!tempPhoneNumber.trim()) {
      setSettingsMessage("Please enter a phone number");
      return;
    }

    setIsLoadingSettings(true);
    setSettingsMessage("");

    try {
      const response = await fetch(`${BACKEND_HOST}/api/user/settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          canvaUserId,
          phoneNumber: tempPhoneNumber.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPhoneNumber(tempPhoneNumber.trim());
        setIsEditingPhone(false);
        setSettingsMessage("Settings saved successfully!");
        setTimeout(() => setSettingsMessage(""), 3000);
      } else {
        setSettingsMessage(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Settings save error:", error);
      setSettingsMessage("Network error while saving settings");
    } finally {
      setIsLoadingSettings(false);
    }
  };

  return (
    <AppUiProvider>
      <div className="app-container">
        {isOffline && (
          <div className="offline-indicator">
            You're offline. Some features may not work properly.
          </div>
        )}

        {currentView === "login" && (
          <div className="login-view">
            <div className="login-card">
              <div className="login-header">
                <div className="login-header-top">
                  <div className="login-header-left">
                    <div className="login-icon">
                      <svg className="icon icon-xl" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div className="login-title">Connect to Zotok</div>
                  </div>
                </div>
                <div className="login-subtitle">
                  Enter your workspace credentials to browse products.
                </div>
              </div>
              <AuthForm onAuthSuccess={handleAuthSuccess} error={authError} />
            </div>
          </div>
        )}

        {currentView === "main" && (
          <div id="main-view" className="main-view">
            <div className="main-header">
              <div className="header-content">
                <div className="header-icon">
                  <svg className="icon icon-lg" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h1 className="main-title">Zotok Browser</h1>
              </div>
            </div>

            <div className="tab-container">
              <button
                className={`tab ${activeTab === "products" ? "active" : ""}`}
                onClick={() => setActiveTab("products")}
              >
                <svg className="icon" viewBox="0 0 24 24">
                  <path d="M20 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
                  <path d="M14 2H10a2 2 0 0 0-2 2v5h8V4a2 2 0 0 0-2-2z" />
                </svg>
                Products
              </button>
              <button
                className={`tab ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => setActiveTab("settings")}
              >
                <svg className="icon" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Settings
              </button>
            </div>

            <div className="tab-content">
              {activeTab === "products" && (
                <ProductList
                  authToken={authToken!}
                  onProductSelect={handleProductSelect}
                  onTokenExpired={handleTokenExpired}
                />
              )}

              {activeTab === "settings" && (
                <div className="settings-content">
                  <div className="settings-form">
                    <div className="settings-header">
                      <div className="settings-icon">
                        <svg className="icon icon-xl" viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className="login-title">User Settings</div>
                      <div className="login-subtitle">
                        Configure your preferences.
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phoneNumber" className="form-label">
                        Phone Number
                      </label>

                      {phoneNumber && !isEditingPhone ? (
                        // View mode - show existing phone number with pencil icon inside
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            className="form-input"
                            value={phoneNumber}
                            disabled
                            readOnly
                            style={{ paddingRight: "40px" }}
                          />
                          <button
                            type="button"
                            onClick={handleEditPhone}
                            className="phone-edit-btn"
                            aria-label="Edit phone number"
                            title="Edit phone number"
                          >
                            <svg className="icon" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        // Edit mode OR no phone number - show editable input
                        <div className="phone-input-container">
                          <input
                            id="phoneNumber"
                            type="tel"
                            className="form-input"
                            value={tempPhoneNumber}
                            onChange={(e) => setTempPhoneNumber(e.target.value)}
                            placeholder="Enter your phone number"
                            disabled={isLoadingSettings}
                          />

                          <div className="phone-edit-actions">
                            <button
                              className="phone-save-btn"
                              onClick={saveSettings}
                              disabled={
                                isLoadingSettings || !tempPhoneNumber.trim()
                              }
                            >
                              {isLoadingSettings ? "Saving..." : "Save"}
                            </button>
                            {phoneNumber && (
                              <button
                                className="phone-cancel-btn"
                                onClick={handleCancelEdit}
                                disabled={isLoadingSettings}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {settingsMessage && (
                      <div
                        className={`settings-message ${settingsMessage.includes("success") ? "success" : "error"}`}
                      >
                        {settingsMessage}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === "detail" && selectedProduct && (
          <div id="detail-view" className="detail-view">
            <ProductDetail
              product={selectedProduct}
              onBack={handleBackToMain}
              authToken={authToken!}
              onTokenExpired={handleTokenExpired}
              phoneNumber={phoneNumber}
            />
          </div>
        )}
      </div>
    </AppUiProvider>
  );
};