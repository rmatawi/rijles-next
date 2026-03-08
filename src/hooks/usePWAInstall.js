// src/hooks/usePWAInstall.js
// Hook for PWA installation functionality

import { useState, useEffect } from 'react';

/**
 * Custom hook for PWA installation
 * Handles the beforeinstallprompt event and provides install functionality
 */
export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    const checkStandalone = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone ||
                        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
      setIsInstalled(standalone);
    };

    // Detect iOS
    const detectIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIOSDevice);
    };

    checkStandalone();
    detectIOS();

    // Listen for beforeinstallprompt event (Chrome, Edge, Samsung Internet)
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Store the event so it can be triggered later
      setInstallPrompt(e);
      setIsInstallable(true);

      console.log('[PWA] Install prompt captured');
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Trigger the PWA install prompt
   */
  const promptInstall = async () => {
    if (!installPrompt) {
      console.warn('[PWA] No install prompt available');
      return { success: false, error: 'No install prompt available' };
    }

    try {
      // Show the install prompt
      installPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await installPrompt.userChoice;

      console.log(`[PWA] User response: ${outcome}`);

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setIsInstallable(false);
        setInstallPrompt(null);
        return { success: true, outcome: 'accepted' };
      } else {
        console.log('[PWA] User dismissed the install prompt');
        return { success: false, outcome: 'dismissed' };
      }
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Check if app can be installed
   */
  const canInstall = () => {
    // For iOS, show manual instructions
    if (isIOS && !isStandalone) {
      return true;
    }
    // For other browsers, check if prompt is available
    return isInstallable && installPrompt !== null;
  };

  return {
    promptInstall,      // Function to trigger install
    canInstall: canInstall(), // Boolean: can app be installed
    isInstallable,      // Boolean: install prompt available
    isInstalled,        // Boolean: app is already installed
    isIOS,              // Boolean: running on iOS
    isStandalone,       // Boolean: running as installed PWA
  };
};

export default usePWAInstall;
