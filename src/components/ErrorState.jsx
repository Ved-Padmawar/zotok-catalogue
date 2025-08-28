import React, { useState } from 'react';
import { Alert, Button, Box, Rows, Text } from '@canva/app-ui-kit';
import { ERROR_MESSAGES } from '../utils/constants.jsx';
import "../styles/modern-components.css";

/**
 * Modern Error State Component with retry functionality
 * @param {Object} props - Component props
 * @param {string} props.title - Error title
 * @param {string} props.message - Error message
 * @param {Function} props.onRetry - Retry callback
 * @param {string} props.retryLabel - Retry button label
 * @param {boolean} props.showRetry - Whether to show retry button
 * @param {string} props.variant - Error variant ('critical', 'warning', 'info')
 * @param {string} props.icon - Custom icon
 * @param {React.ReactNode} props.children - Additional content
 */
export function ErrorState({ 
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
  showRetry = true,
  variant = 'critical',
  icon,
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

  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'critical': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❌';
    }
  };

  return (
    <Box className={`error-state error-${variant}`}>
      <Alert tone={variant}>
        <Rows spacing="3u">
          <div className="error-header">
            <span className="error-icon">{getIcon()}</span>
            <Text size="medium" variant="bold" className="error-title">
              {title}
            </Text>
          </div>
          
          {message && (
            <Text size="small" tone="tertiary" className="error-message">
              {message}
            </Text>
          )}
          
          {children && (
            <div className="error-content">
              {children}
            </div>
          )}
          
          {showRetry && onRetry && (
            <div className="error-actions">
              <Button
                variant="secondary"
                onClick={handleRetry}
                disabled={isRetrying}
                loading={isRetrying}
                className="retry-button"
              >
                {isRetrying ? 'Retrying...' : retryLabel}
              </Button>
            </div>
          )}
        </Rows>
      </Alert>
    </Box>
  );
}

/**
 * Network error component with specific messaging
 * @param {Object} props - Component props
 * @param {Function} props.onRetry - Retry callback
 */
export function NetworkError({ onRetry }) {
  return (
    <ErrorState
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      retryLabel="Reconnect"
      icon="🌐"
      variant="warning"
    />
  );
}

/**
 * Authentication error component
 * @param {Object} props - Component props
 * @param {Function} props.onRetry - Retry callback
 */
export function AuthError({ onRetry }) {
  return (
    <ErrorState
      title="Authentication Failed"
      message="Your session has expired or your credentials are invalid. Please log in again."
      onRetry={onRetry}
      retryLabel="Log in again"
      icon="🔐"
      variant="critical"
    />
  );
}

/**
 * Product load error component
 * @param {Object} props - Component props
 * @param {Function} props.onRetry - Retry callback
 */
export function ProductLoadError({ onRetry }) {
  return (
    <ErrorState
      title="Failed to Load Products"
      message="We couldn't load the product catalog. This might be a temporary issue."
      onRetry={onRetry}
      retryLabel="Reload products"
      icon="📦"
      variant="critical"
    />
  );
}

/**
 * Empty state for no products
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onClearSearch - Clear search callback
 */
export function EmptyProductsState({ searchQuery, onClearSearch }) {
  return (
    <Box className="empty-state">
      <Rows spacing="4u" align="center">
        <div className="empty-icon">
          📭
        </div>
        
        <div className="empty-content">
          <Text size="medium" variant="bold" tone="secondary" alignment="center">
            {searchQuery ? 'No products found' : 'No products available'}
          </Text>
          
          <Text size="small" tone="tertiary" alignment="center">
            {searchQuery 
              ? `No products match "${searchQuery}". Try a different search term.`
              : 'There are no products available at this time.'
            }
          </Text>
        </div>
        
        {searchQuery && onClearSearch && (
          <Button
            variant="secondary"
            onClick={onClearSearch}
            className="btn btn-secondary"
          >
            Clear search
          </Button>
        )}
      </Rows>
    </Box>
  );
}

/**
 * Feature not supported error
 * @param {Object} props - Component props
 * @param {string} props.feature - Feature name
 */
export function FeatureNotSupported({ feature = 'This feature' }) {
  return (
    <ErrorState
      title="Feature Not Available"
      message={`${feature} is not supported in the current context.`}
      showRetry={false}
      icon="🚫"
      variant="info"
    />
  );
}

/**
 * Generic error boundary fallback
 * @param {Object} props - Component props
 * @param {Error} props.error - Error object
 * @param {Function} props.resetError - Reset error callback
 */
export function ErrorBoundaryFallback({ error, resetError }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="error-boundary">
      <ErrorState
        title="Application Error"
        message="Something unexpected happened. The application has encountered an error."
        onRetry={resetError}
        retryLabel="Reload application"
        icon="🔧"
        variant="critical"
      >
        <div className="error-details">
          <Button
            variant="tertiary"
            onClick={() => setShowDetails(!showDetails)}
            className="btn btn-secondary"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            {showDetails ? 'Hide' : 'Show'} error details
          </Button>
          
          {showDetails && (
            <div className="error-stack">
              <Text size="xsmall" className="error-stack-text">
                <pre>{error?.stack || error?.message || 'Unknown error'}</pre>
              </Text>
            </div>
          )}
        </div>
      </ErrorState>
    </div>
  );
}

/**
 * Timeout error component
 * @param {Object} props - Component props
 * @param {Function} props.onRetry - Retry callback
 */
export function TimeoutError({ onRetry }) {
  return (
    <ErrorState
      title="Request Timeout"
      message="The request took too long to complete. Please try again."
      onRetry={onRetry}
      retryLabel="Try again"
      icon="⏱️"
      variant="warning"
    />
  );
}

/**
 * Permission error component
 * @param {Object} props - Component props
 * @param {string} props.action - Action that was attempted
 */
export function PermissionError({ action = 'perform this action' }) {
  return (
    <ErrorState
      title="Permission Denied"
      message={`You don't have permission to ${action}.`}
      showRetry={false}
      icon="🔒"
      variant="critical"
    />
  );
}

// CSS styles for error components
const errorStyles = `
  /* Base error state */
  .error-state {
    margin: var(--space-4);
    animation: slideUp 0.3s ease-out;
  }

  .error-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .error-icon {
    font-size: var(--text-xl);
    flex-shrink: 0;
  }

  .error-title {
    color: var(--text-primary);
  }

  .error-message {
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
  }

  .error-content {
    padding: var(--space-3);
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-primary);
  }

  .error-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: center;
  }

  /* Error variants */
  .error-critical {
    border-left: 4px solid var(--error);
  }

  .error-warning {
    border-left: 4px solid var(--warning);
  }

  .error-info {
    border-left: 4px solid var(--info);
  }

  /* Retry button */
  .retry-button {
    min-width: 120px;
    position: relative;
    overflow: hidden;
  }

  .retry-button:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .retry-button:active {
    transform: translateY(0);
  }

  /* Empty state */
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    padding: var(--space-8);
    text-align: center;
  }

  .empty-icon {
    font-size: 64px;
    opacity: 0.6;
    margin-bottom: var(--space-4);
  }

  .empty-content {
    max-width: 300px;
  }

  /* Error boundary */
  .error-boundary {
    padding: var(--space-6);
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    margin: var(--space-4);
  }

  .error-details {
    margin-top: var(--space-3);
  }

  .error-stack {
    margin-top: var(--space-2);
    padding: var(--space-3);
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    max-height: 200px;
    overflow-y: auto;
  }

  .error-stack-text {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-secondary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Loading state for retry */
  .retry-button[loading="true"] {
    position: relative;
  }

  .retry-button[loading="true"]::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }

  /* Responsive design */
  @media (max-width: 480px) {
    .error-state {
      margin: var(--space-3);
    }
    
    .empty-state {
      padding: var(--space-6);
      min-height: 250px;
    }
    
    .empty-icon {
      font-size: 48px;
    }
    
    .error-boundary {
      margin: var(--space-3);
      padding: var(--space-4);
    }
    
    .error-header {
      gap: var(--space-2);
    }
  }

  /* Accessibility enhancements */
  .error-state [role="alert"] {
    padding: var(--space-4);
  }

  /* Focus management */
  .retry-button:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  /* Animation variants */
  .error-bounce {
    animation: bounce 0.6s ease-out;
  }

  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translateY(0);
    }
    40%, 43% {
      transform: translateY(-20px);
    }
    70% {
      transform: translateY(-10px);
    }
    90% {
      transform: translateY(-4px);
    }
  }

  /* High contrast mode */
  @media (prefers-contrast: high) {
    .error-critical { border-left-width: 6px; }
    .error-warning { border-left-width: 6px; }
    .error-info { border-left-width: 6px; }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = errorStyles;
  document.head.appendChild(styleSheet);
}

export default ErrorState;