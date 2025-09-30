import { useState, useEffect } from "react";
import { AppUiProvider, Tabs, TabList, Tab, TabPanels, TabPanel, FormField, TextInput, Button, Rows } from "@canva/app-ui-kit";
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
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

type AppView = "login" | "main" | "detail";
type ActiveTab = "products" | "settings";

export const App = () => {
  const [currentView, setCurrentView] = useState<AppView>("login");
  const [, setActiveTab] = useState<ActiveTab>("products");
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
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
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

      const userToken = await auth.getCanvaUserToken();
      if (userToken) {
        // Create a simple hash-based user ID from the token
        const userId = btoa(userToken).slice(0, 32);

        setCanvaUserId(userId);

        // Check for stored token in sessionStorage first (faster)
        const storedToken = sessionStorage.getItem("zotok_login_token");
        if (storedToken) {
          setAuthToken(storedToken);
          setCurrentView("main");
          await loadUserSettings(userId);
          return;
        }

        // Check backend for stored token
        const tokenResponse = await retryRequest(() =>
          authService.getStoredToken(userId),
        );
        if (tokenResponse.success && tokenResponse.token) {
          setAuthToken(tokenResponse.token);
          sessionStorage.setItem("zotok_login_token", tokenResponse.token);
          setCurrentView("main");
          await loadUserSettings(userId);
        } else {
          setCurrentView("login");
        }
      } else {
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
          const safePhoneNumber = String(data.phoneNumber || '');
          setPhoneNumber(safePhoneNumber);
          setTempPhoneNumber(safePhoneNumber);
        } else {
          setPhoneNumber("");
          setTempPhoneNumber("");
        }
      } else {
      }
    } catch (error) {
      // Settings loading failed, continue silently
    }
  };

  const handleAuthSuccess = async (credentials: {
    workspaceId: string;
    clientId: string;
    clientSecret: string;
  }) => {
    try {
      setAuthError("");

      if (!credentials || !credentials.workspaceId || !credentials.clientId || !credentials.clientSecret) {
        setAuthError("Invalid credentials provided");
        return;
      }

      const response = await authService.login({
        ...credentials,
        canvaUserId,
      });

      if (response?.success && response?.token) {
        setAuthToken(response.token);
        sessionStorage.setItem("zotok_login_token", response.token);
        setCurrentView("main");
        await loadUserSettings(canvaUserId);
      } else {
        console.error("Authentication failed:", response?.error || 'Unknown error');
        setAuthError(response?.error || "Authentication failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("Network error during authentication");
    }
  };

  const handleLogout = () => {
    try {
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
    } catch (error) {
      console.error('Error in handleLogout:', error);
    }
  };

  const handleProductSelect = (product: Product) => {
    try {
      if (!product) {
        console.error('Product is null or undefined');
        return;
      }
      setSelectedProduct(product);
      setCurrentView("detail");
    } catch (error) {
      console.error('Error in handleProductSelect:', error);
    }
  };

  const handleBackToMain = () => {
    try {
      setSelectedProduct(null);
      setCurrentView("main");
    } catch (error) {
      console.error('Error in handleBackToMain:', error);
    }
  };

  const handleTokenExpired = async (): Promise<boolean> => {
    try {
      const response = await authService.refreshToken(canvaUserId);
      if (response.success && response.token) {
        setAuthToken(response.token);
        sessionStorage.setItem("zotok_login_token", response.token);
        return true;
      } else {
        handleLogout();
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      handleLogout();
      return false;
    }
  };


  const handleEditPhone = () => {
    try {
      setIsEditingPhone(true);
      setTempPhoneNumber(phoneNumber || '');
      setSettingsMessage("");
    } catch (error) {
      console.error('Error in handleEditPhone:', error);
    }
  };

  const handleCancelEdit = () => {
    try {
      setIsEditingPhone(false);
      setTempPhoneNumber(phoneNumber || '');
      setSettingsMessage("");
    } catch (error) {
      console.error('Error in handleCancelEdit:', error);
    }
  };

  const saveSettings = async () => {
    try {
      if (!tempPhoneNumber?.trim()) {
        setSettingsMessage("Please enter a phone number");
        return;
      }

      if (!authToken) {
        setSettingsMessage("Authentication required to save settings");
        return;
      }

      setIsLoadingSettings(true);
      setSettingsMessage("");

      const response = await fetch(`${BACKEND_HOST}/api/user/settings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          canvaUserId,
          phoneNumber: String(tempPhoneNumber || '').trim(),
        }),
      });

      const data = await response.json();

      if (data?.success) {
        setPhoneNumber(String(tempPhoneNumber || '').trim());
        setIsEditingPhone(false);
        setSettingsMessage("Settings saved successfully!");
        setTimeout(() => setSettingsMessage(""), 3000);
      } else {
        setSettingsMessage(data?.error || "Failed to save settings");
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
                    <div className="login-title">Connect to zotok</div>
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
          <div id="main-view" className="main-view" style={{ paddingTop: '8px' }}>
            <Tabs defaultActiveId="products" height="fill" onSelect={(activeId) => setActiveTab(activeId as ActiveTab)}>
              <TabList>
                <Tab id="products">Products</Tab>
                <Tab id="settings">Settings</Tab>
              </TabList>

              <TabPanels>
                <TabPanel id="products">
                  <ProductList
                    authToken={authToken!}
                    onProductSelect={handleProductSelect}
                    onTokenExpired={handleTokenExpired}
                  />
                </TabPanel>

                <TabPanel id="settings">
                  <div style={{ padding: 'var(--space-md)' }}>
                    <Rows spacing="2u">
                      {phoneNumber && !isEditingPhone ? (
                        // View mode - show existing phone number with edit button
                        <FormField
                          label="Phone number"
                          control={(props) => (
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                              <div style={{ flex: 1 }}>
                                <TextInput
                                  {...props}
                                  value={phoneNumber || ''}
                                  disabled
                                />
                              </div>
                              <Button
                                variant="secondary"
                                onClick={handleEditPhone}
                                aria-label="Edit phone number"
                              >
                                Edit
                              </Button>
                            </div>
                          )}
                        />
                      ) : (
                        // Edit mode OR no phone number - show editable input
                        <>
                          <FormField
                            label="Phone number"
                            control={(props) => (
                              <TextInput
                                {...props}
                                type="tel"
                                value={tempPhoneNumber || ''}
                                onChange={setTempPhoneNumber}
                                placeholder="Enter your phone number"
                                disabled={isLoadingSettings}
                              />
                            )}
                          />

                          <Button
                            variant="primary"
                            onClick={saveSettings}
                            disabled={isLoadingSettings || !tempPhoneNumber.trim()}
                            stretch
                          >
                            {isLoadingSettings ? "Saving..." : "Save"}
                          </Button>

                          {phoneNumber && (
                            <Button
                              variant="secondary"
                              onClick={handleCancelEdit}
                              disabled={isLoadingSettings}
                              stretch
                            >
                              Cancel
                            </Button>
                          )}
                        </>
                      )}
                    </Rows>

                    {settingsMessage && (
                      <div style={{
                        marginTop: 'var(--space-md)',
                        padding: 'var(--space-sm)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        textAlign: 'center',
                        backgroundColor: settingsMessage.includes("success") ? 'var(--success-light)' : 'var(--error-light)',
                        color: settingsMessage.includes("success") ? 'var(--success-color)' : 'var(--error-color)'
                      }}>
                        {settingsMessage}
                      </div>
                    )}
                  </div>
                </TabPanel>
              </TabPanels>
            </Tabs>
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