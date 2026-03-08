import { useEffect } from "react";
import { f7 } from "framework7-react";

const usePageVisibility = () => {
  useEffect(() => {
    // Set up page visibility change listener to preserve URL parameters
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // When the page becomes visible again, preserve the current URL
        const currentUrlParams = new URLSearchParams(window.location.search);
        const currentPage = currentUrlParams.get("page");
        if (currentPage && f7?.views?.main?.router) {
          // Only update if the current page isn't already correct
          const currentRoute = f7.views.main.router.currentRoute;
          // Removed automatic navigation state preservation on visibility change
          // Page state will not auto-sync when returning to focus
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up listener on unmount
    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);
};

export default usePageVisibility;