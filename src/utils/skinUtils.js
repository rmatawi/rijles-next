// src/utils/skinUtils.js
// Dynamic skin loading utility for HomePage components

import { getLayout } from "../js/utils";

// Skin configuration mapping
const SKIN_CONFIGS = {
  amelia: {
    name: "Amelia",
    colors: ["#1A73E8", "#34A853", "#FBBC05", "#EA4335", "#202124"],
    description: "Classic blue theme"
  },
  default: {
    name: "Default", 
    colors: ["#2196F3", "#4CAF50", "#FF9800", "#F44336", "#212121"],
    description: "Material design theme"
  },
  rayer: {
    name: "Rayer",
    colors: ["#FB8C00", "#34A853", "#FBBC05", "#EA4335", "#202124"],
    description: "Modern orange theme"
  }
};
const isBrowser = typeof window !== "undefined";

/**
 * Get the currently selected skin from localStorage or default
 * @returns {string} The skin key (amelia, default, rayer)
 */
export const getCurrentSkin = () => {
  const envSkin = process.env.VITE_REACT_APP_TITLE?.toLowerCase();
  const storedSkin = isBrowser
    ? window.localStorage.getItem("selectedSkin") || envSkin || "default"
    : envSkin || "default";
  if (storedSkin && SKIN_CONFIGS[storedSkin]) {
    return storedSkin;
  }
    return "default"; // Default skin
};

/**
 * Get skin configuration for the current skin
 * @returns {Object} Skin configuration object
 */
export const getCurrentSkinConfig = () => {
  const skin = getCurrentSkin();
  return SKIN_CONFIGS[skin];
};

/**
 * Dynamically import a skin-specific component
 * @param {string} componentName - Name of the component (e.g., "DrivingSchoolCard", "LearningModulesGrid")
 * @param {string} skin - Skin name (amelia, default, rayer)
 * @returns {Promise<React.Component>} The imported component
 */
export const importSkinComponent = async (componentName, skin = null) => {
  const targetSkin = skin || getCurrentSkin();
  
  try {
    // Try to import the skin-specific component
    // We use template literals with limited dynamic parts so Vite can statically analyze
    let loadedModule;
    if (targetSkin === 'amelia') {
      if (componentName === 'DrivingSchoolCard') loadedModule = await import('../components/home/skins/amelia/DrivingSchoolCard.jsx');
      else if (componentName === 'LearningModulesGrid') loadedModule = await import('../components/home/skins/amelia/LearningModulesGrid.jsx');
    } else if (targetSkin === 'rayer') {
      if (componentName === 'DrivingSchoolCard') loadedModule = await import('../components/home/skins/rayer/DrivingSchoolCard.jsx');
      else if (componentName === 'LearningModulesGrid') loadedModule = await import('../components/home/skins/rayer/LearningModulesGrid.jsx');
    } else {
      if (componentName === 'DrivingSchoolCard') loadedModule = await import('../components/home/skins/default/DrivingSchoolCard.jsx');
      else if (componentName === 'LearningModulesGrid') loadedModule = await import('../components/home/skins/default/LearningModulesGrid.jsx');
    }
    
    if (!loadedModule) throw new Error("Component not found in skin");
    return loadedModule.default || loadedModule;
  } catch (error) {
    console.warn(`Failed to load skin-specific component for ${targetSkin}, falling back to default:`, error);
    
    // Fallback to default component
    try {
      let loadedModule;
      if (componentName === 'DrivingSchoolCard') loadedModule = await import('../components/home/DrivingSchoolCard.jsx');
      else if (componentName === 'LearningModulesGrid') loadedModule = await import('../components/home/LearningModulesGrid.jsx');
      
      if (!loadedModule) throw new Error("Default component not found");
      return loadedModule.default || loadedModule;
    } catch (fallbackError) {
      console.error(`Failed to load default component:`, fallbackError);
      throw new Error(`Could not load component ${componentName}`);
    }
  }
};

/**
 * Get the appropriate component based on current skin
 * @param {string} componentName - Name of the component
 * @param {Object} props - Props to pass to the component
 * @returns {Promise<Object>} Object containing the component and props
 */
export const getSkinComponent = async (componentName, props = {}) => {
  try {
    const Component = await importSkinComponent(componentName);
    return { Component, props };
  } catch (error) {
    console.error(`Error loading skin component ${componentName}:`, error);
    // Return a fallback component or null
    return { Component: null, props: {} };
  }
};

/**
 * Apply skin-specific CSS classes to an element
 * @param {string} baseClass - Base CSS class
 * @param {string} skin - Skin name
 * @returns {string} Combined CSS classes
 */
export const getSkinClass = (baseClass, skin = null) => {
  const targetSkin = skin || getCurrentSkin();
  return `${baseClass} ${baseClass}-${targetSkin}`;
};

/**
 * Get skin-specific styles
 * @param {string} skin - Skin name
 * @returns {Object} CSS-in-JS styles object
 */
export const getSkinStyles = (skin = null) => {
  const targetSkin = skin || getCurrentSkin();
  const config = SKIN_CONFIGS[targetSkin];
  
  if (!config) {
    return {};
  }

  return {
    '--app-primary-color': config.colors[0],
    '--app-accent-green': config.colors[1], 
    '--app-accent-yellow': config.colors[2],
    '--app-accent-red': config.colors[3],
    '--app-dark-neutral': config.colors[4]
  };
};

/**
 * Apply current skin colors to CSS custom properties
 */
export const applyCurrentSkinColors = () => {
  if (typeof document === "undefined") return;
  const config = getCurrentSkinConfig();
  if (!config) return;

  const root = document.documentElement;
  root.style.setProperty('--app-primary-color', config.colors[0]);
  root.style.setProperty('--app-accent-green', config.colors[1]);
  root.style.setProperty('--app-accent-yellow', config.colors[2]);
  root.style.setProperty('--app-accent-red', config.colors[3]);
  root.style.setProperty('--app-dark-neutral', config.colors[4]);
};

/**
 * Initialize skin system on app start
 */
export const initializeSkinSystem = () => {
  if (!isBrowser) return;

  // Apply current skin colors
  applyCurrentSkinColors();

  // Update colors when skin changes in another tab/window
  window.addEventListener("storage", (event) => {
    if (event.key === "selectedSkin" && event.newValue !== event.oldValue) {
      applyCurrentSkinColors();
    }
  });
};

// Initialize the skin system when this module is imported
initializeSkinSystem();
