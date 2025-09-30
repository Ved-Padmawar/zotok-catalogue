import { AppI18nProvider } from "@canva/app-i18n-kit";
import { AppUiProvider } from "@canva/app-ui-kit";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import "@canva/app-ui-kit/styles.css";
import "./styles/modern-components.css";

// Enhanced error logging for debugging
window.addEventListener("error", (event) => {
  console.error("Global Error:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  });
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled Promise Rejection:", {
    reason: event.reason,
    promise: event.promise,
  });
});

// Performance monitoring
if (typeof window !== "undefined") {
  // Log initial load performance
  window.addEventListener("load", () => {
    const perfData = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    // Performance data available for debugging if needed
  });

  // Monitor memory usage in development
  if (process.env.NODE_ENV === "development") {
    setInterval(() => {
      if ("memory" in performance) {
        const memInfo = (performance as any).memory;
        const memUsage = Math.round(memInfo.usedJSHeapSize / 1048576); // MB

        if (memUsage > 100) {
          // Warn if over 100MB
          console.warn("High memory usage:", memUsage + "MB");
        }
      }
    }, 30000); // Check every 30 seconds
  }
}

const root = createRoot(document.getElementById("root") as Element);

function render() {
  root.render(
    <ErrorBoundary>
      <AppI18nProvider>
        <AppUiProvider>
          <App />
        </AppUiProvider>
      </AppI18nProvider>
    </ErrorBoundary>,
  );
}

// Enhanced development features
if (module.hot) {
  module.hot.accept("./app", () => {
    // Hot reloading app
    render();
  });

  // Clear console on hot reload in development
  if (process.env.NODE_ENV === "development") {
    module.hot.accept(() => {
      console.clear();
      // Development mode
    });
  }
}

// Initialize app
render();

// Development helpers
if (process.env.NODE_ENV === "development") {
  // Development mode features available
}
