// src/utils/colorUtils.js

/**
 * Get the primary color from environment or Framework7 color
 * @returns {string} - Primary color hex
 */
export const getPrimaryColor = () => {
  // Try to get from env first
  const envColor = process.env.VITE_COLOR_SCHEME?.split(",")?.[0];
  if (envColor) return envColor;

  // Fallback to Framework7's CSS variable if available
  if (typeof window !== 'undefined' && typeof getComputedStyle !== 'undefined') {
    const root = document.documentElement;
    const f7Color = getComputedStyle(root).getPropertyValue('--f7-theme-color').trim();
    if (f7Color) return f7Color;
  }

  // Final fallback
  return "#1A73E8";
};

/**
 * Lighten a hex color by a given amount
 * @param {string} color - Hex color (e.g., "#007aff")
 * @param {number} amount - Amount to lighten (default 30)
 * @returns {string} - Lightened hex color
 */
export const lightenColor = (color, amount = 30) => {
  if (!color) return getPrimaryColor();
  return `#${color
    .replace("#", "")
    .replace(/../g, (hex) =>
      ("0" + Math.min(255, parseInt(hex, 16) + amount).toString(16)).slice(-2)
    )}`;
};

/**
 * Create a gradient from a base color
 * @param {string} baseColor - Base hex color
 * @param {number} lightenAmount - Amount to lighten for gradient end (default 40)
 * @param {string} direction - CSS gradient direction (default "0deg")
 * @returns {string} - CSS linear-gradient value
 */
export const createGradient = (baseColor, lightenAmount = 40, direction = "0deg") => {
  const base = baseColor || getPrimaryColor();
  return `linear-gradient(${direction}, ${base}, ${lightenColor(base, lightenAmount)})`;
};

/**
 * Calculate brightness of a hex color (0-255)
 * @param {string} color - Hex color
 * @returns {number} - Brightness value where 0 is dark and 255 is light
 */
export const getBrightness = (color) => {
  if (!color) return 0;
  const hex = color.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  return ((r * 299) + (g * 587) + (b * 114)) / 1000;
};

/**
 * Check if a color is light
 * @param {string} color - Hex color
 * @returns {boolean} - true if light, false if dark
 */
export const isLight = (color) => {
  return getBrightness(color) > 155; // Threshold for switching text color
};

/**
 * Convert hex color to rgba string
 * @param {string} hex - Hex color (e.g., "#3b82f6")
 * @param {number} alpha - Alpha value (0 to 1)
 * @returns {string} - RGBA string
 */
export const hexToRgba = (hex, alpha) => {
  if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    // Fallback to default blue if hex is invalid
    return `rgba(59, 130, 246, ${alpha})`;
  }
  
  let r, g, b;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  }
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
