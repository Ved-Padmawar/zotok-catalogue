import React, { useState, useEffect } from 'react';

/**
 * Modern Theme Toggle Component with smooth transitions
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showLabel - Whether to show theme labels
 * @param {string} props.size - Size variant ('sm', 'md', 'lg')
 */
export default function ThemeToggle({ 
  className = '', 
  showLabel = true,
  size = 'md'
}) {
  const [isDark, setIsDark] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Detect current theme on mount
    const detectCurrentTheme = () => {
      const htmlTheme = document.documentElement.getAttribute('data-theme');
      const bodyTheme = document.body.getAttribute('data-theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Check saved preference first
      const savedTheme = localStorage.getItem('zotok-theme-preference');
      
      let currentTheme = 'light';
      if (savedTheme) {
        currentTheme = savedTheme;
      } else if (htmlTheme || bodyTheme) {
        currentTheme = htmlTheme || bodyTheme;
      } else if (systemPrefersDark) {
        currentTheme = 'dark';
      }
      
      setIsDark(currentTheme === 'dark');
      return currentTheme;
    };

    detectCurrentTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      if (!localStorage.getItem('zotok-theme-preference')) {
        setIsDark(e.matches);
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);

    // Listen for external theme changes (from Canva or other sources)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' &&
            (mutation.attributeName === 'data-theme' || 
             mutation.attributeName === 'data-color-theme')) {
          const currentTheme = detectCurrentTheme();
          // Only update if different from manual override
          if (!localStorage.getItem('zotok-theme-preference')) {
            setIsDark(currentTheme === 'dark');
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-color-theme', 'class']
    });

    return () => {
      mediaQuery.removeEventListener('change', handleSystemChange);
      observer.disconnect();
    };
  }, []);

  const applyTheme = (theme) => {
    console.log('🎨 Applying theme:', theme);
    
    // Apply to multiple elements for better coverage
    const elements = [
      document.documentElement,
      document.body,
      document.querySelector('.app-container')
    ].filter(Boolean);
    
    elements.forEach(element => {
      element?.setAttribute('data-theme', theme);
      element?.setAttribute('data-color-theme', theme);
      element?.classList.toggle('dark-theme', theme === 'dark');
      element?.classList.toggle('light-theme', theme === 'light');
    });

    // Update CSS custom properties for immediate effect
    document.documentElement.style.setProperty('--current-theme', theme);
    
    // Save preference
    localStorage.setItem('zotok-theme-preference', theme);
  };

  const toggleTheme = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    const newTheme = isDark ? 'light' : 'dark';
    
    // Add transition class for smooth animation
    document.documentElement.classList.add('theme-transitioning');
    
    setTimeout(() => {
      setIsDark(!isDark);
      applyTheme(newTheme);
      
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
        setIsTransitioning(false);
      }, 200);
    }, 0);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          height: '28px',
          fontSize: 'var(--text-xs)',
          padding: '0 var(--space-md)',
          gap: 'var(--space-sm)'
        };
      case 'lg':
        return {
          height: '44px',
          fontSize: 'var(--text-md)',
          padding: '0 var(--space-xl)',
          gap: 'var(--space-md)'
        };
      default: // md
        return {
          height: '36px',
          fontSize: 'var(--text-sm)',
          padding: '0 var(--space-lg)',
          gap: 'var(--space-md)'
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <button
      onClick={toggleTheme}
      disabled={isTransitioning}
      className={`theme-toggle ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme (current: ${isDark ? 'dark' : 'light'})`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--text-secondary)',
        cursor: isTransitioning ? 'wait' : 'pointer',
        transition: 'all var(--transition-fast)',
        fontFamily: 'inherit',
        fontWeight: 'var(--font-weight-medium)',
        outline: 'none',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        ...sizeStyles
      }}
      onMouseEnter={(e) => {
        if (!isTransitioning) {
          e.target.style.background = 'var(--bg-hover)';
          e.target.style.borderColor = 'var(--border-hover)';
          e.target.style.color = 'var(--text-primary)';
          e.target.style.transform = 'translateY(-1px)';
          e.target.style.boxShadow = 'var(--shadow-sm)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isTransitioning) {
          e.target.style.background = 'var(--bg-secondary)';
          e.target.style.borderColor = 'var(--border-primary)';
          e.target.style.color = 'var(--text-secondary)';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--border-focus)';
        e.target.style.boxShadow = '0 0 0 2px var(--primary-light)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--border-primary)';
        e.target.style.boxShadow = 'none';
      }}
    >
      {/* Animated background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: isDark ? '50%' : '0%',
          width: '50%',
          height: '100%',
          background: 'var(--primary-light)',
          borderRadius: 'inherit',
          transition: 'left var(--transition-normal)',
          zIndex: 0
        }}
      />
      
      {/* Icon and text content */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: sizeStyles.gap
      }}>
        <span 
          className="theme-icon"
          style={{
            fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px',
            transition: 'transform var(--transition-fast)',
            transform: isTransitioning ? 'scale(0.8) rotate(180deg)' : 'scale(1) rotate(0deg)'
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </span>
        
        {showLabel && (
          <span 
            className="theme-label"
            style={{
              transition: 'opacity var(--transition-fast)',
              opacity: isTransitioning ? 0.5 : 1,
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {isDark ? 'Light' : 'Dark'}
          </span>
        )}
      </div>
      
      {/* Loading indicator for transitions */}
      {isTransitioning && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '12px',
            height: '12px',
            border: '2px solid transparent',
            borderTop: '2px solid var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            zIndex: 2
          }}
        />
      )}
    </button>
  );
}

// Add CSS for theme transitions and animations
if (typeof document !== 'undefined') {
  const existingStyle = document.getElementById('theme-toggle-styles');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'theme-toggle-styles';
    styleSheet.textContent = `
      /* Theme transition effects */
      .theme-transitioning * {
        transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease !important;
      }
      
      /* Smooth theme switching */
      :root {
        transition: none;
      }
      
      html.theme-transitioning {
        transition: none;
      }
      
      /* Spin animation for loading indicator */
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Enhanced focus styles for theme toggle */
      .theme-toggle:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      
      /* Disabled state */
      .theme-toggle:disabled {
        opacity: 0.6;
        cursor: wait;
        pointer-events: none;
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .theme-toggle {
          border-width: 2px;
        }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .theme-toggle * {
          transition: none !important;
          animation: none !important;
        }
        
        .theme-transitioning * {
          transition: none !important;
        }
      }
      
      /* Touch device optimizations */
      @media (hover: none) and (pointer: coarse) {
        .theme-toggle {
          min-height: 44px;
          min-width: 44px;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}