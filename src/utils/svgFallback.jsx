// Enhanced SVG fallback generator with CORS-aware image handling

import { IMAGE_CONFIG } from './constants.jsx';

/**
 * Generates a modern SVG placeholder with gradient backgrounds and better theming
 * @param {string} productName - Name of the product
 * @param {number} size - Size of the SVG
 * @param {Object} options - Additional options
 * @returns {string} Base64 encoded SVG data URL
 */
export function generateProductSVG(
  productName = 'Product',
  size = IMAGE_CONFIG.FALLBACK_SIZE,
  options = {}
) {
  const {
    backgroundColor = 'transparent',
    textColor = '#64748b',
    gradient = true,
    style = 'modern',
    theme = 'light'
  } = options;

  // Get initials or first character
  const initial = productName.trim().charAt(0).toUpperCase() || 'P';
  
  // Calculate font size based on SVG size
  const fontSize = Math.floor(size * 0.4);
  const strokeWidth = Math.max(1, Math.floor(size * 0.008));

  // Theme-aware colors
  const isDark = theme === 'dark';
  const primaryColor = isDark ? '#60a5fa' : '#3b82f6';
  const secondaryColor = isDark ? '#8b5cf6' : '#6366f1';
  const bgColor = isDark ? '#334155' : '#f1f5f9';
  const finalTextColor = isDark ? '#f8fafc' : textColor;

  let backgroundElement;
  
  if (gradient) {
    // Create modern gradient background
    const gradientId = `grad-${Math.random().toString(36).substr(2, 9)}`;
    backgroundElement = `
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:${secondaryColor};stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:${primaryColor};stop-opacity:0.9" />
        </linearGradient>
        <filter id="shadow-${gradientId}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#${gradientId})" rx="${size * 0.05}" filter="url(#shadow-${gradientId})"/>
    `;
  } else {
    backgroundElement = `
      <rect width="100%" height="100%" fill="${backgroundColor || bgColor}" rx="${size * 0.05}"/>
    `;
  }

  let content;
  switch (style) {
    case 'circle':
      content = `
        ${backgroundElement}
        <circle 
          cx="50%" 
          cy="50%" 
          r="${size * 0.35}" 
          fill="rgba(255,255,255,0.15)" 
          stroke="rgba(255,255,255,0.3)" 
          stroke-width="${strokeWidth}"
        />
        <text 
          x="50%" 
          y="50%" 
          font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" 
          font-size="${fontSize}px" 
          font-weight="600"
          fill="${finalTextColor}" 
          text-anchor="middle" 
          dominant-baseline="central"
        >
          ${initial}
        </text>
      `;
      break;
      
    case 'minimal':
      content = `
        ${backgroundElement}
        <text 
          x="50%" 
          y="50%" 
          font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" 
          font-size="${fontSize}px" 
          font-weight="500"
          fill="${finalTextColor}" 
          text-anchor="middle" 
          dominant-baseline="central"
          opacity="0.9"
        >
          ${initial}
        </text>
      `;
      break;

    case 'icon':
      const iconSize = size * 0.3;
      content = `
        ${backgroundElement}
        <g transform="translate(${size/2 - iconSize/2}, ${size/2 - iconSize/2})">
          <rect 
            width="${iconSize}" 
            height="${iconSize * 0.7}" 
            fill="none" 
            stroke="${finalTextColor}" 
            stroke-width="${strokeWidth}" 
            rx="${iconSize * 0.1}"
            opacity="0.6"
          />
          <circle 
            cx="${iconSize * 0.3}" 
            cy="${iconSize * 0.3}" 
            r="${iconSize * 0.08}" 
            fill="${finalTextColor}"
            opacity="0.6"
          />
          <path 
            d="M${strokeWidth} ${iconSize * 0.5} 
               L${iconSize * 0.3} ${iconSize * 0.3} 
               L${iconSize * 0.7} ${iconSize * 0.4} 
               L${iconSize - strokeWidth} ${iconSize * 0.2} 
               L${iconSize - strokeWidth} ${iconSize * 0.7 - strokeWidth}"
            stroke="${finalTextColor}" 
            stroke-width="${strokeWidth}" 
            fill="none"
            opacity="0.6"
          />
        </g>
      `;
      break;
      
    default: // modern
      content = `
        ${backgroundElement}
        <rect 
          x="25%" 
          y="25%" 
          width="50%" 
          height="50%" 
          fill="rgba(255,255,255,0.15)" 
          rx="${size * 0.08}" 
          stroke="rgba(255,255,255,0.25)" 
          stroke-width="${strokeWidth}"
        />
        <text 
          x="50%" 
          y="50%" 
          font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" 
          font-size="${fontSize}px" 
          font-weight="600"
          fill="white" 
          text-anchor="middle" 
          dominant-baseline="central"
        >
          ${initial}
        </text>
      `;
  }

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      ${content}
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a product icon SVG for products without names
 * @param {number} size - Size of the SVG
 * @param {Object} options - Additional options
 * @returns {string} Base64 encoded SVG data URL
 */
export function generateProductIconSVG(size = IMAGE_CONFIG.FALLBACK_SIZE, options = {}) {
  const {
    backgroundColor = '#f1f5f9',
    iconColor = '#64748b',
    style = 'package',
    theme = 'light'
  } = options;

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#334155' : backgroundColor;
  const finalIconColor = isDark ? '#94a3b8' : iconColor;
  
  const strokeWidth = Math.max(2, Math.floor(size * 0.025));
  const centerX = size / 2;
  const centerY = size / 2;
  const iconSize = size * 0.4;

  let iconContent;
  
  switch (style) {
    case 'image':
      iconContent = `
        <g opacity="0.7">
          <rect 
            x="${centerX - iconSize/2}" 
            y="${centerY - iconSize/2}" 
            width="${iconSize}" 
            height="${iconSize * 0.7}" 
            fill="none" 
            stroke="${finalIconColor}" 
            stroke-width="${strokeWidth}" 
            rx="${iconSize * 0.1}"
          />
          <circle 
            cx="${centerX - iconSize/4}" 
            cy="${centerY - iconSize/4}" 
            r="${iconSize * 0.1}" 
            fill="${finalIconColor}"
          />
          <path 
            d="M${centerX - iconSize/2 + strokeWidth} ${centerY + iconSize/4} 
               L${centerX - iconSize/4} ${centerY} 
               L${centerX + iconSize/4} ${centerY + iconSize/8} 
               L${centerX + iconSize/2 - strokeWidth} ${centerY - iconSize/8} 
               L${centerX + iconSize/2 - strokeWidth} ${centerY + iconSize/2 - iconSize * 0.15}"
            stroke="${finalIconColor}" 
            stroke-width="${strokeWidth}" 
            fill="none"
          />
        </g>
      `;
      break;
      
    case 'box':
      iconContent = `
        <g opacity="0.7">
          <rect 
            x="${centerX - iconSize/2}" 
            y="${centerY - iconSize/2}" 
            width="${iconSize}" 
            height="${iconSize}" 
            fill="none" 
            stroke="${finalIconColor}" 
            stroke-width="${strokeWidth}" 
            rx="${iconSize * 0.1}"
          />
          <line 
            x1="${centerX - iconSize/2}" 
            y1="${centerY - iconSize/6}" 
            x2="${centerX + iconSize/2}" 
            y2="${centerY - iconSize/6}" 
            stroke="${finalIconColor}" 
            stroke-width="${strokeWidth}"
          />
          <line 
            x1="${centerX - iconSize/6}" 
            y1="${centerY - iconSize/2}" 
            x2="${centerX - iconSize/6}" 
            y2="${centerY + iconSize/2}" 
            stroke="${finalIconColor}" 
            stroke-width="${strokeWidth}"
          />
        </g>
      `;
      break;
      
    default: // package
      iconContent = `
        <g opacity="0.7">
          <rect 
            x="${centerX - iconSize/2}" 
            y="${centerY - iconSize/3}" 
            width="${iconSize}" 
            height="${iconSize * 0.8}" 
            fill="none" 
            stroke="${finalIconColor}" 
            stroke-width="${strokeWidth}" 
            rx="${iconSize * 0.08}"
          />
          <rect 
            x="${centerX - iconSize/3}" 
            y="${centerY - iconSize/2}" 
            width="${iconSize * 0.66}" 
            height="${iconSize * 0.5}" 
            fill="none" 
            stroke="${finalIconColor}" 
            stroke-width="${strokeWidth}" 
            rx="${iconSize * 0.05}"
          />
          <circle 
            cx="${centerX}" 
            cy="${centerY}" 
            r="${iconSize * 0.06}" 
            fill="${finalIconColor}"
          />
        </g>
      `;
  }

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="${bgColor}" rx="${size * 0.05}"/>
      ${iconContent}
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Enhanced image URL validation with CORS detection
 * @param {string} url - Image URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if image loads, false otherwise
 */
export function checkImageUrl(url, timeout = 3000) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string') {
      resolve(false);
      return;
    }

    // Skip data URLs and invalid protocols
    if (url.startsWith('data:')) {
      resolve(true);
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      resolve(false);
      return;
    }

    const img = new Image();
    let resolved = false;
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        img.onload = null;
        img.onerror = null;
      }
    };
    
    img.onload = () => {
      cleanup();
      resolve(true);
    };
    
    img.onerror = () => {
      cleanup();
      resolve(false);
    };
    
    // Set timeout
    setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeout);
    
    try {
      // Set crossOrigin to handle CORS
      img.crossOrigin = "anonymous";
      img.src = url;
    } catch (error) {
      cleanup();
      resolve(false);
    }
  });
}

/**
 * Enhanced function to get the best image URL with CORS handling and fallback
 * @param {string|Array<string>} productImages - Product images
 * @param {string} productName - Product name for fallback
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Best available image URL or SVG fallback
 */
export async function getBestProductImage(
  productImages,
  productName,
  options = {}
) {
  const {
    maxRetries = 2,
    timeout = 2000,
    fallbackStyle = 'modern',
    preferredSize = IMAGE_CONFIG.FALLBACK_SIZE,
    theme = 'light'
  } = options;

  // Normalize images to array
  let imageUrls = [];
  if (typeof productImages === 'string') {
    imageUrls = productImages.split(',').map(url => url.trim()).filter(url => url);
  } else if (Array.isArray(productImages)) {
    imageUrls = productImages.filter(url => url && typeof url === 'string');
  }

  // If no images provided, return SVG fallback immediately
  if (imageUrls.length === 0) {
    return productName 
      ? generateProductSVG(productName, preferredSize, { style: fallbackStyle, theme })
      : generateProductIconSVG(preferredSize, { style: fallbackStyle, theme });
  }

  // Try each image URL with retries
  for (const imageUrl of imageUrls) {
    // Skip obviously invalid URLs
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
      continue;
    }

    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        const isValid = await checkImageUrl(imageUrl, timeout);
        if (isValid) {
          // Valid image found
          return imageUrl;
        }
      } catch (error) {
        console.warn(`Image check failed for ${imageUrl}:`, error);
      }
      
      attempts++;
      
      // Add delay between retries
      if (attempts < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 300 * attempts));
      }
    }
  }
  
  // All images failed, using SVG fallback
  
  // All images failed, return SVG fallback
  return productName 
    ? generateProductSVG(productName, preferredSize, { style: fallbackStyle, theme })
    : generateProductIconSVG(preferredSize, { style: fallbackStyle, theme });
}

/**
 * Creates an enhanced fallback image handler for use in img onError events
 * @param {string} productName - Product name for generating SVG
 * @param {Object} options - Fallback options
 * @returns {Function} Function to handle image errors
 */
export function createImageErrorHandler(productName, options = {}) {
  const {
    style = 'modern',
    size = IMAGE_CONFIG.FALLBACK_SIZE,
    retryCount = 1,
    theme = 'light'
  } = options;

  return (event) => {
    const img = event.currentTarget || event.target;
    if (!img || img.dataset.fallbackApplied) return;

    // Mark as fallback applied to prevent infinite loops
    img.dataset.fallbackApplied = 'true';
    
    // Image error, applying fallback
    
    // Generate fallback SVG
    const fallbackSrc = productName 
      ? generateProductSVG(productName, size, { style, theme })
      : generateProductIconSVG(size, { style, theme });
    
    img.src = fallbackSrc;
    img.alt = `${productName || 'Product'} (placeholder)`;
    
    // Add CSS class for styling fallback images
    img.classList.add('fallback-image');
  };
}

/**
 * Enhanced image preloader with better error handling
 * @param {Array<string>} imageUrls - Array of image URLs
 * @param {Object} options - Preload options
 * @returns {Promise<Array>} Array of load results
 */
export async function preloadImages(imageUrls, options = {}) {
  const {
    timeout = 3000,
    concurrency = 2
  } = options;

  if (!Array.isArray(imageUrls)) {
    return [];
  }

  const loadImage = (url) => {
    return new Promise((resolve) => {
      if (!url || !url.startsWith('http')) {
        resolve({ url, success: false, error: 'Invalid URL' });
        return;
      }

      const img = new Image();
      let resolved = false;
      
      const cleanup = (success, error = null) => {
        if (!resolved) {
          resolved = true;
          img.onload = null;
          img.onerror = null;
          resolve({ url, success, image: success ? img : null, error });
        }
      };
      
      img.onload = () => cleanup(true);
      img.onerror = (e) => cleanup(false, e.message || 'Load failed');
      
      setTimeout(() => cleanup(false, 'Timeout'), timeout);
      
      try {
        img.crossOrigin = "anonymous";
        img.src = url;
      } catch (error) {
        cleanup(false, error.message);
      }
    });
  };

  // Load images with concurrency limit
  const results = [];
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(loadImage));
    results.push(...batchResults);
  }

  return results;
}

/**
 * Generates a consistent color based on a string (for consistent avatars/placeholders)
 * @param {string} str - Input string
 * @param {Object} options - Color options
 * @returns {string} CSS color value
 */
export function generateColorFromString(str, options = {}) {
  const { saturation = 65, lightness = 55, format = 'hsl' } = options;
  
  if (!str) return format === 'hsl' ? `hsl(220, ${saturation}%, ${lightness}%)` : '#3b82f6';
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  
  if (format === 'hsl') {
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  } else {
    // Convert HSL to hex
    const h = hue / 360;
    const s = saturation / 100;
    const l = lightness / 100;
    
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const g = Math.round(hue2rgb(p, q, h) * 255);
    const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}

/**
 * Detects current theme from document
 * @returns {string} Current theme ('light' or 'dark')
 */
export function detectCurrentTheme() {
  const htmlTheme = document.documentElement.getAttribute('data-theme');
  const bodyTheme = document.body.getAttribute('data-theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (htmlTheme === 'dark' || bodyTheme === 'dark') return 'dark';
  if (htmlTheme === 'light' || bodyTheme === 'light') return 'light';
  
  return systemPrefersDark ? 'dark' : 'light';
}

export default {
  generateProductSVG,
  generateProductIconSVG,
  checkImageUrl,
  getBestProductImage,
  createImageErrorHandler,
  preloadImages,
  generateColorFromString,
  detectCurrentTheme
};