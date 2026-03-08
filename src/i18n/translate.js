// src/i18n/translate.js
import translations from './translations.json';

// Default language
const DEFAULT_LANGUAGE = 'nl';
const isBrowser = typeof window !== 'undefined';
let currentLanguage = isBrowser
  ? window.localStorage.getItem('language') || DEFAULT_LANGUAGE
  : DEFAULT_LANGUAGE;

/**
 * Set the current language
 * @param {string} lang - Language code (e.g., 'nl', 'en', 'sr')
 */
export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
    if (isBrowser) {
      window.localStorage.setItem('language', lang);
    }
    return true;
  }
  console.warn(`Language '${lang}' not supported. Using default language.`);
  return false;
};

/**
 * Get the current language
 * @returns {string} Current language code
 */
export const getLanguage = () => {
  return currentLanguage;
};

/**
 * Translate a key with optional parameters
 * @param {string} key - Translation key (e.g., 'common.save')
 * @param {object} params - Optional parameters for the translation
 * @returns {string} Translated text
 */
export const t = (key, params = {}) => {
  try {
    // Split the key into parts (e.g., 'common.save' -> ['common', 'save'])
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    // Navigate through the nested object
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // If key doesn't exist in current language, fallback to default language
        value = translations[DEFAULT_LANGUAGE];
        for (const k2 of keys) {
          if (value && value[k2] !== undefined) {
            value = value[k2];
          } else {
            return key; // Return original key if not found in default language
          }
        }
        break;
      }
    }

    // If value is a function, execute it with params
    if (typeof value === 'function') {
      return value(params);
    }

    // If value is a string and params exist, replace placeholders
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      let result = value;
      for (const [paramKey, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
      }
      return result;
    }

    return value;
  } catch (error) {
    console.warn(`Translation error for key '${key}':`, error);
    return key;
  }
};

/**
 * Get all available languages
 * @returns {Array<string>} Array of available language codes
 */
export const getAvailableLanguages = () => {
  return Object.keys(translations);
};

// Initialize language
setLanguage(currentLanguage);

export default { t, setLanguage, getLanguage, getAvailableLanguages };
