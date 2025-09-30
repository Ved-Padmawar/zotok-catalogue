import React, { Component, useState } from 'react';
import { ERROR_MESSAGES, ENV } from '../utils/constants.jsx';

/**
 * Enhanced Error Boundary Component with detailed error reporting
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.group('🚨 Application Error Caught by Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    this.setState({
      error,
      errorInfo
    });

    // Report to error service in production
    if (ENV.isProduction && ENV.FEATURES.ENABLE_ERROR_REPORTING) {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error, errorInfo) => {
    // In a real app, send to error reporting service
    const errorReport = {
      id: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Error report generated
    // TODO: Send to error reporting service (Sentry, LogRocket, etc.)
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Enhanced Error Boundary Fallback Component
 */
function ErrorBoundaryFallback({ error, errorInfo, errorId, onRetry }) {
  const [showDetails, setShowDetails] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const sendReport = () => {
    // Simulate sending report
    setReportSent(true);
    // Error report sent
  };

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <div className="error-boundary-container">
      <div className="error-boundary-content">
        {/* Error Icon and Title */}
        <div className="error-header">
          <div className="error-icon">💥</div>
          <h1 className="error-title">Something went wrong</h1>
          <p className="error-description">
            The application encountered an unexpected error. Our team has been notified.
          </p>
        </div>

        {/* Error Actions */}
        <div className="error-actions">
          <button 
            onClick={onRetry}
            className="btn btn-primary"
          >
            Try Again
          </button>
          
          <button 
            onClick={reloadPage}
            className="btn btn-secondary"
          >
            Reload Page
          </button>
        </div>

        {/* Error Details Toggle */}
        <div className="error-details-section">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="btn btn-tertiary"
            style={{ fontSize: 'var(--text-sm)' }}
          >
            {showDetails ? '🔼 Hide' : '🔽 Show'} Error Details
          </button>

          {showDetails && (
            <div className="error-details">
              <div className="error-info-grid">
                <div className="error-info-item">
                  <strong>Error ID:</strong>
                  <code>{errorId}</code>
                </div>
                
                <div className="error-info-item">
                  <strong>Time:</strong>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                
                <div className="error-info-item">
                  <strong>Message:</strong>
                  <code>{error?.message || 'Unknown error'}</code>
                </div>
              </div>

              {ENV.isDevelopment && (
                <div className="error-stack">
                  <details>
                    <summary><strong>Stack Trace</strong></summary>
                    <pre>{error?.stack}</pre>
                  </details>
                  
                  {errorInfo?.componentStack && (
                    <details>
                      <summary><strong>Component Stack</strong></summary>
                      <pre>{errorInfo.componentStack}</pre>
                    </details>
                  )}
                </div>
              )}

              {/* Report Error Button */}
              <div className="error-report">
                {!reportSent ? (
                  <button
                    onClick={sendReport}
                    className="btn btn-tertiary"
                    style={{ fontSize: 'var(--text-xs)' }}
                  >
                    📤 Send Error Report
                  </button>
                ) : (
                  <div style={{ 
                    color: 'var(--success)', 
                    fontSize: 'var(--text-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)'
                  }}>
                    ✅ Error report sent
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Help Links */}
        <div className="error-help">
          <p>Need help? Try these steps:</p>
          <ul>
            <li>Refresh the page and try again</li>
            <li>Check your internet connection</li>
            <li>Clear your browser cache</li>
            <li>Try using a different browser</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Network Error Component
 */
export function NetworkError({ onRetry, canRetry = true }) {
  return (
    <ErrorState
      icon="🌐"
      title="Connection Error"
      message="Unable to connect to Zotok. Please check your internet connection."
      onRetry={canRetry ? onRetry : undefined}
      retryLabel="Reconnect"
      variant="warning"
    />
  );
}

/**
 * Authentication Error Component
 */
export function AuthError({ onRetry }) {
  return (
    <ErrorState
      icon="🔐"
      title="Authentication Failed"
      message="Your session has expired or your credentials are invalid."
      onRetry={onRetry}
      retryLabel="Sign In Again"
      variant="critical"
    />
  );
}

/**
 * Product Load Error Component
 */
export function ProductLoadError({ onRetry, productName }) {
  return (
    <ErrorState
      icon="📦"
      title="Failed to Load Products"
      message={`Unable to load ${productName ? `"${productName}"` : 'product information'}. This might be a temporary issue.`}
      onRetry={onRetry}
      retryLabel="Try Again"
      variant="warning"
    />
  );
}

/**
 * Empty State Component
 */
export function EmptyState({ 
  icon = "📭", 
  title, 
  message, 
  actionLabel, 
  onAction,
  searchQuery,
  onClearSearch 
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      
      <div className="empty-content">
        <h3 className="empty-title">
          {title || (searchQuery ? 'No results found' : 'No items available')}
        </h3>
        
        <p className="empty-message">
          {message || (searchQuery 
            ? `No items match "${searchQuery}". Try a different search term.`
            : 'There are no items to display at this time.'
          )}
        </p>
      </div>
      
      <div className="empty-actions">
        {searchQuery && onClearSearch && (
          <button onClick={onClearSearch} className="btn btn-secondary">
            Clear Search
          </button>
        )}
        
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn btn-primary">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Feature Not Supported Component
 */
export function FeatureNotSupported({ feature, designType }) {
  return (
    <ErrorState
      icon="🚫"
      title="Feature Not Available"
      message={`${feature || 'This feature'} is not supported in ${designType || 'the current design type'}.`}
      variant="info"
      showRetry={false}
    />
  );
}

/**
 * Timeout Error Component
 */
export function TimeoutError({ onRetry, operation = 'operation' }) {
  return (
    <ErrorState
      icon="⏱️"
      title="Request Timeout"
      message={`The ${operation} took too long to complete. Please try again.`}
      onRetry={onRetry}
      retryLabel="Try Again"
      variant="warning"
    />
  );
}

/**
 * Generic Error State Component
 */
export function ErrorState({ 
  icon = "❌",
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try Again",
  showRetry = true,
  variant = "critical",
  children
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          borderColor: 'var(--warning)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)'
        };
      case 'info':
        return {
          borderColor: 'var(--info)',
          backgroundColor: 'rgba(6, 182, 212, 0.1)'
        };
      default: // critical
        return {
          borderColor: 'var(--error)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)'
        };
    }
  };

  return (
    <div className="error-state" style={getVariantStyles()}>
      <div className="error-state-content">
        <div className="error-state-header">
          <span className="error-state-icon">{icon}</span>
          <h3 className="error-state-title">{title}</h3>
        </div>
        
        {message && (
          <p className="error-state-message">{message}</p>
        )}
        
        {children && (
          <div className="error-state-children">{children}</div>
        )}
        
        {showRetry && onRetry && (
          <div className="error-state-actions">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="btn btn-primary"
            >
              {isRetrying ? 'Retrying...' : retryLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// CSS Styles for Error Components
const errorStyles = `
  /* Error Boundary Container */
  .error-boundary-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: var(--space-xl);
    background: var(--bg-secondary);
  }

  .error-boundary-content {
    max-width: 600px;
    width: 100%;
    background: var(--bg-card);
    border-radius: var(--radius-xl);
    border: 1px solid var(--border-primary);
    padding: var(--space-3xl);
    box-shadow: var(--shadow-lg);
    text-align: center;
  }

  /* Error Header */
  .error-header {
    margin-bottom: var(--space-3xl);
  }

  .error-icon {
    font-size: 64px;
    margin-bottom: var(--space-lg);
    opacity: 0.8;
  }

  .error-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-md);
  }

  .error-description {
    font-size: var(--text-base);
    color: var(--text-secondary);
    line-height: var(--line-height-relaxed);
    margin: 0;
  }

  /* Error Actions */
  .error-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
    margin-bottom: var(--space-2xl);
  }

  /* Error Details */
  .error-details-section {
    border-top: 1px solid var(--border-primary);
    padding-top: var(--space-xl);
    margin-bottom: var(--space-xl);
  }

  .error-details {
    margin-top: var(--space-lg);
    text-align: left;
    background: var(--bg-secondary);
    padding: var(--space-lg);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-primary);
  }

  .error-info-grid {
    display: grid;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
  }

  .error-info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-sm);
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .error-info-item strong {
    color: var(--text-secondary);
    font-size: var(--text-sm);
  }

  .error-info-item code,
  .error-info-item span {
    font-family: ui-monospace, SF Mono, Monaco, Consolas, monospace;
    font-size: var(--text-xs);
    color: var(--text-primary);
    background: var(--bg-input);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
  }

  .error-stack {
    margin-top: var(--space-lg);
  }

  .error-stack details {
    margin-bottom: var(--space-md);
  }

  .error-stack summary {
    cursor: pointer;
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
    padding: var(--space-sm);
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }

  .error-stack pre {
    background: var(--bg-input);
    padding: var(--space-md);
    border-radius: var(--radius-sm);
    overflow-x: auto;
    font-size: var(--text-xs);
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .error-report {
    margin-top: var(--space-lg);
    padding-top: var(--space-lg);
    border-top: 1px solid var(--border-primary);
  }

  /* Error Help */
  .error-help {
    text-align: left;
    background: var(--bg-secondary);
    padding: var(--space-lg);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-primary);
  }

  .error-help p {
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
    margin-bottom: var(--space-md);
  }

  .error-help ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .error-help li {
    padding: var(--space-sm) 0;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
    position: relative;
    padding-left: var(--space-lg);
  }

  .error-help li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--primary);
    font-weight: bold;
  }

  /* Error State Components */
  .error-state {
    margin: var(--space-lg);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    background: var(--bg-card);
    box-shadow: var(--shadow-sm);
  }

  .error-state-content {
    padding: var(--space-3xl);
    text-align: center;
  }

  .error-state-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-lg);
  }

  .error-state-icon {
    font-size: 32px;
    opacity: 0.8;
  }

  .error-state-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }

  .error-state-message {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    line-height: var(--line-height-relaxed);
    margin-bottom: var(--space-xl);
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .error-state-actions {
    display: flex;
    justify-content: center;
    gap: var(--space-md);
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-4xl);
    text-align: center;
    min-height: 300px;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: var(--space-xl);
    opacity: 0.6;
  }

  .empty-content {
    margin-bottom: var(--space-xl);
  }

  .empty-title {
    font-size: var(--text-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-md);
  }

  .empty-message {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    line-height: var(--line-height-relaxed);
    max-width: 400px;
    margin: 0 auto;
  }

  .empty-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
  }

  /* Responsive Design */
  @media (max-width: 600px) {
    .error-boundary-content {
      padding: var(--space-xl);
      margin: var(--space-md);
    }

    .error-actions {
      flex-direction: column;
    }

    .error-info-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-sm);
    }
  }

  /* High Contrast Mode */
  @media (prefers-contrast: high) {
    .error-state,
    .error-boundary-content {
      border-width: 2px;
    }
  }

  /* Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    .error-state,
    .error-boundary-content {
      transition: none;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('error-boundary-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'error-boundary-styles';
    styleSheet.textContent = errorStyles;
    document.head.appendChild(styleSheet);
  }
}

export default ErrorBoundary;