// src/hooks/useShortUrlHandler.js
// Hook for handling short URL detection and redirection

import { useEffect } from "react";
import { f7 } from "framework7-react";
import { shortUrlService } from "../services/shortUrlService";

/**
 * Custom hook for detecting and handling short URLs
 * Detects URLs like ?id=abc12345 and redirects to /single-maquette?id={full-uuid}
 */
export const useShortUrlHandler = () => {
  useEffect(() => {
    const handleShortUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");
      const page = urlParams.get("page");

      // Only process if we have an 'id' parameter but no 'page' parameter
      // This indicates it might be a short URL
      if (id && !page) {
        console.log("[Short URL] Detected potential short URL:", id);

        // Check if this is a short URL (8 characters, no dashes) vs UUID (36 chars with dashes)
        const isShortUrl = id.length === 8 && !id.includes("-");

        if (isShortUrl) {
          console.log("[Short URL] Confirmed short URL format, resolving...");

          try {
            // Look up the actual maquette ID from short URL
            const { data, error } = await shortUrlService.getMaquetteIdFromShortId(id);

            if (error || !data) {
              console.error("[Short URL] Failed to resolve short URL:", error);

              // Show error to user
              if (f7) {
                f7.dialog.alert(
                  "Deze link is ongeldig of verlopen. Controleer de link en probeer opnieuw.",
                  "Ongeldige Link"
                );
              }
              return;
            }

            const actualMaquetteId = data.maquette_id;
            console.log("[Short URL] Resolved to maquette ID:", actualMaquetteId);

            // Redirect to the full maquette page URL
            // Preserve other parameters like admin_id, ref, etc.
            urlParams.delete("id"); // Remove short ID
            urlParams.delete("school"); // Ensure school is removed
            urlParams.set("id", actualMaquetteId);
            const query = urlParams.toString();
            const newUrl = query
              ? `/single-maquette?${urlParams.toString()}`
              : "/single-maquette";
            console.log("[Short URL] Redirecting to:", newUrl);

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
          } catch (err) {
            console.error("[Short URL] Error processing short URL:", err);

            if (f7) {
              f7.dialog.alert(
                "Er is een fout opgetreden bij het laden van deze link.",
                "Fout"
              );
            }
          }
        } else {
          console.log("[Short URL] Not a short URL (appears to be full UUID)");
        }
      }
    };

    // Run on initial load
    handleShortUrl();

    // Also handle when URL changes (for PWA scenarios)
    const handlePopState = () => {
      handleShortUrl();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return null;
};

export default useShortUrlHandler;
