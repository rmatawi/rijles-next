// src/hooks/useDeepLinking.js
// Hook for handling deep links in PWA

import { useEffect } from 'react';
import { f7 } from 'framework7-react';
import useAppNavigation from "./useAppNavigation";

/**
 * Custom hook for handling deep links when PWA is opened from external links
 * This handles the scenario where a user clicks a link and it should open in the installed PWA
 */
export const useDeepLinking = () => {
  const { navigate } = useAppNavigation();
  const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
  const isStandalone = isBrowser && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://')
  );

  useEffect(() => {
    if (!isBrowser) return;

    // Handle the initial load - check if opened with URL parameters
    const handleInitialUrl = () => {
      const currentUrl = window.location.href;
      const urlParams = new URLSearchParams(window.location.search);

      // Check if we have query parameters that need handling
      if (urlParams.toString()) {
        const page = urlParams.get('page');
        const maquette = urlParams.get('maquette');

        if (page) {
          // Framework7 will handle this automatically via routing
        }

        if (maquette) {
          // Could show a toast or handle specifically
        }
      }
    };

    // Check if running as standalone PWA
    if (isStandalone) {
      handleInitialUrl();
    }

    // Handle launch queue (for PWAs opened from external links)
    // This is a modern API that handles when PWA is launched from external sources
    if ('launchQueue' in window) {
      window.launchQueue.setConsumer((launchParams) => {
        if (launchParams.targetURL) {
          const url = new URL(launchParams.targetURL);

          // Navigate to the URL path in the PWA
          if (url.search) {
            const params = new URLSearchParams(url.search);
            const page = params.get('page');

            if (page) {
              navigate(`/?${url.search}`, {
                reloadCurrent: true,
                ignoreCache: true
              });
            }
          }
        }
      });
    }

    // Handle when app comes back to foreground (visibility change)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isStandalone) {
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle custom navigation events (for Share Target API)
    const handleNavigationEvent = (event) => {
      if (event.detail && event.detail.url) {
      }
    };

    window.addEventListener('navigation-event', handleNavigationEvent);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('navigation-event', handleNavigationEvent);
    };
  }, [navigate, isBrowser, isStandalone]);

  return {
    // Could return utility functions if needed
    isStandalone,
  };
};

export default useDeepLinking;
