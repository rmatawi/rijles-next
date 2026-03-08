// src/hooks/useShareUrlHandler.js
// Hook for handling short share URL detection and redirection

import { useEffect } from "react";
import { f7 } from "framework7-react";
import { shareUrlService } from "../services/shareUrlService";

/**
 * Custom hook for detecting and handling short share URLs
 * Detects URLs like ?share=abc12345 and redirects to full URLs with school and admin_id parameters
 */
export const useShareUrlHandler = () => {
  useEffect(() => {
    const handleShareUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shareCode = urlParams.get("share");

      // Only process if we have a 'share' parameter
      if (shareCode) {
        console.log("[Share URL] Detected share URL code:", shareCode);

        try {
          // Look up the actual full URL from the short code
          const { data, error } = await shareUrlService.getFullUrlFromShortCode(shareCode);

          if (error || !data) {
            console.error("[Share URL] Failed to resolve share URL:", error);

            // Show error to user
            if (f7) {
              f7.dialog.alert(
                "Deze link is ongeldig of verlopen. Controleer de link en probeer opnieuw.",
                "Ongeldige Link"
              );
            }
            return;
          }

          let fullUrl = data.full_url;
          console.log("[Share URL] Resolved to full URL:", fullUrl);

          // Fix for malformed URLs that might have & instead of ? for the first parameter
          if (fullUrl && !fullUrl.includes('?') && fullUrl.includes('&')) {
            fullUrl = fullUrl.replace('&', '?');
            console.log("[Share URL] Fixed malformed URL to:", fullUrl);
          }

          // Parse the full URL to extract parameters
          const fullUrlObj = new URL(fullUrl);
          const fullUrlParams = new URLSearchParams(fullUrlObj.search);

          // Remove the share parameter and add the full URL parameters
          urlParams.delete("share");
          
          // Copy all parameters from the full URL, except for 'school'
          for (const [key, value] of fullUrlParams.entries()) {
            if (key !== "school") {
              urlParams.set(key, value);
            }
          }

          const newUrl = `/?${urlParams.toString()}`;
          console.log("[Share URL] Redirecting to:", newUrl);

          const performNavigation = () => {
            // Use Framework7 router to navigate
            if (f7 && f7.views && f7.views.main) {
              f7.views.main.router.navigate(newUrl, {
                reloadCurrent: true,
                ignoreCache: true,
              });
            } else {
              // Fallback: update browser URL and reload
              window.history.replaceState({}, "", newUrl);
              window.location.reload();
            }
          };

          // Debug mode for localhost: show modal before redirecting
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          if (isLocalhost && f7) {
            const fullRedirectUrl = window.location.origin + newUrl;
            f7.dialog.confirm(
              `Resolved URL: ${fullRedirectUrl}<br><br>Do you want to proceed with redirection?`,
              "Localhost Debug",
              () => {
                performNavigation();
              }
            );
          } else {
            performNavigation();
          }
        } catch (err) {
          console.error("[Share URL] Error processing share URL:", err);

          if (f7) {
            f7.dialog.alert(
              "Er is een fout opgetreden bij het laden van deze link.",
              "Fout"
            );
          }
        }
      }
    };

    // Run on initial load
    handleShareUrl();

    // Also handle when URL changes (for PWA scenarios)
    const handlePopState = () => {
      handleShareUrl();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return null;
};

export default useShareUrlHandler;
