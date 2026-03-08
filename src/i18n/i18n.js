// src/i18n/i18n.js - React hook for translations
import { useState, useEffect } from 'react';
import { t as translateFunction, getLanguage, setLanguage } from './translate';

// Create a context to track language changes
let subscribers = [];

// Function to notify all subscribers when language changes
export const subscribeToLanguageChange = (callback) => {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
  };
};

// Function to notify all subscribers
const notifySubscribers = () => {
  subscribers.forEach(callback => callback());
};

// Add a language change listener to update when localStorage changes in other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'language' && e.newValue !== e.oldValue) {
      notifySubscribers();
    }
  });
}

// React hook for translations
export const useI18n = () => {
  const [lang, setLang] = useState(getLanguage());

  useEffect(() => {
    const unsubscribe = subscribeToLanguageChange(() => {
      setLang(getLanguage());
    });

    return unsubscribe;
  }, []);

  return {
    t: translateFunction,
    lang,
    setLanguage: (newLang) => {
      const success = setLanguage(newLang);
      if (success) {
        // This will trigger a re-render since we listen to language changes
        setLang(getLanguage());
      }
      return success;
    },
  };
};

// Export the translate function directly as well
export { translateFunction as t, getLanguage, setLanguage };
