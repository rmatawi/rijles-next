// components/app.jsx - Refactored version
import { useState, useEffect } from "react";
import { App, View, f7ready, f7 } from "framework7-react";
import ReactGA from "react-ga4";
import { HelmetProvider } from "react-helmet-async";

import routes from "../js/routes";
import store from "../js/store";
import { MaquetteGroupsProvider } from "../contexts/MaquetteGroupsContext";
import { AdminStatusProvider } from "../contexts/AdminStatusContext";
import { DemoStatusProvider } from "../contexts/DemoStatusContext";
import { StudentStatusProvider } from "../contexts/StudentStatusContext";
import { MaquetteEventProvider } from "../contexts/MaquetteEventContext";
import { DataProvider } from "../contexts/DataContext";
import { pollAdminStatus } from "../utils/adminUtils";

import useUrlParams from "../hooks/useUrlParams";
import useReferralCode from "../hooks/useReferralCode";
import usePageVisibility from "../hooks/usePageVisibility";
import useAuthState from "../hooks/useAuthState";
import useStudentData from "../hooks/useStudentData";
import useDeepLinking from "../hooks/useDeepLinking";
import useShortUrlHandler from "../hooks/useShortUrlHandler";
import useShareUrlHandler from "../hooks/useShareUrlHandler";
import PWAInstallBanner from "./PWAInstallBanner";

const TRACKING_ID = "G-T7NXM7FQX4"; // YOUR_OWN_TRACKING_ID
ReactGA.initialize(TRACKING_ID);
const APP_BASE_PATH = "/";
const BROWSER_HISTORY_ROOT = APP_BASE_PATH === "/" ? "" : APP_BASE_PATH.replace(/\/$/, "");
const LEGACY_APP_BASE_PATH = "/app";

const PRIVATE_ROUTE_PATHS = new Set([
  "/auth",
  "/student-login",
  "/school-selection",
  "/profile",
  "/student-access-grant",
]);

const PRIVATE_QUERY_PAGES = new Set([
  "auth",
  "student-login",
  "school-selection",
  "profile",
  "admin-profile",
  "admin-request",
  "student-dashboard",
  "admin-access",
  "school-access-request",
  "student-access-request",
  "student-access-registration",
  "verify-access",
  "student-access-grant",
  "accountmanager",
  "admin-management",
]);

const stripAppBasePath = (pathname = "/") => {
  if (!pathname) return "/";
  if (pathname === LEGACY_APP_BASE_PATH) return "/";
  if (pathname.startsWith(`${LEGACY_APP_BASE_PATH}/`)) {
    return pathname.slice(LEGACY_APP_BASE_PATH.length) || "/";
  }
  return pathname;
};

const normalizePath = (pathname = "/") => {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
};

const getNormalizedLocationUrl = () => {
  const pathname = normalizePath(stripAppBasePath(window.location.pathname));
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");
  let normalizedPath = pathname;

  // Backward compatibility for old links like /?page=profile
  if (normalizedPath === "/" && page) {
    normalizedPath = page === "home" ? "/" : `/${page}`;
    params.delete("page");
  }

  const query = params.toString();
  const nextUrl = query ? `${normalizedPath}?${query}` : normalizedPath;
  const currentUrl = `${pathname}${window.location.search || ""}`;

  if (nextUrl !== currentUrl) {
    window.history.replaceState({}, "", nextUrl);
  }

  return nextUrl;
};

const ensureRobotsMeta = () => {
  let robotsMeta = document.querySelector('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = document.createElement("meta");
    robotsMeta.setAttribute("name", "robots");
    document.head.appendChild(robotsMeta);
  }
  return robotsMeta;
};

const shouldNoIndexRoute = (urlValue) => {
  try {
    const normalizedUrl = urlValue?.startsWith("http")
      ? urlValue
      : `${window.location.origin}${urlValue || "/"}`;
    const parsed = new URL(normalizedUrl);
    const path = normalizePath(stripAppBasePath(parsed.pathname));
    const page = parsed.searchParams.get("page");
    return PRIVATE_ROUTE_PATHS.has(path) || Boolean(page && PRIVATE_QUERY_PAGES.has(page));
  } catch (error) {
    return false;
  }
};

const updateRobotsForRoute = (urlValue) => {
  const robotsMeta = ensureRobotsMeta();
  const robotsValue = shouldNoIndexRoute(urlValue) ? "noindex, nofollow" : "index, follow";
  robotsMeta.setAttribute("content", robotsValue);
};

const MyApp = () => {
  // Initialize all custom hooks for different responsibilities
  useUrlParams();
  useReferralCode();
  useAuthState();
  usePageVisibility();
  useDeepLinking(); // Handle deep links when PWA is opened from external links
  useShortUrlHandler(); // Handle short URL detection and redirection for maquettes (?id=abc12345)
  useShareUrlHandler(); // Handle short URL detection and redirection for school sharing (?share=abc12345)

  // Use student data hook with auth info
  const { authUser, isAuthenticated } = store.state || {
    authUser: null,
    isAuthenticated: false,
  };
  useStudentData(authUser, isAuthenticated);

  // Set dynamic navbar and toolbar colors from environment variable
  useEffect(() => {
    const colorScheme = process.env.VITE_COLOR_SCHEME?.split(",") || [];
    const primaryColor = colorScheme[0] || "#1A73E8";
    
    // Set CSS variables for navbar and toolbar
    const root = document.documentElement;
    root.style.setProperty('--f7-navbar-bg-color', primaryColor);
    root.style.setProperty('--f7-toolbar-bg-color', primaryColor);
    root.style.setProperty('--f7-bars-bg-color', primaryColor);
    root.style.setProperty('--f7-bars-text-color', '#ffffff');
    root.style.setProperty('--f7-navbar-text-color', '#ffffff');
    root.style.setProperty('--f7-navbar-link-color', '#ffffff');
    root.style.setProperty('--f7-navbar-title-text-color', '#ffffff');
    root.style.setProperty('--f7-toolbar-text-color', '#ffffff');
    root.style.setProperty('--f7-toolbar-link-color', '#ffffff');
  }, []);

  useEffect(() => {
    
    ReactGA.send({
      hitType: "pageview",
      page: window.location.pathname + window.location.search,
    });

    updateRobotsForRoute(window.location.pathname + window.location.search);
  }, []);

  // Framework7 Parameters - removed isadmin since it's now handled by context
  const f7params = {
    name: "Rijles", // App name
    theme: "auto", // Automatic theme detection
    colors: {
      primary: process.env.VITE_COLOR_SCHEME?.split(",")?.[0] || "#1A73E8",
    },
    darkMode: false,
    // darkMode: true,

    // Toast configuration - set default close timeout
    toast: {
      closeTimeout: 3000, // 3 seconds
    },

    // App store
    store: store,
    // App routes
    routes: routes,

    // Register service worker (only on production build)
    serviceWorker: {},

    // Custom layout configuration
    layout: {
      modules_grid: 1,
      hero_image: true,
      rounded: true,
      colorScheme: process.env.VITE_COLOR_SCHEME?.split(",") || [
        "#1A73E8", // Primary Blue (fallback)
        "#34A853", // Accent Green
        "#FBBC05", // Warm Yellow
        "#EA4335", // Alert Red
        "#202124", // Dark Neutral
      ],
    },

    // App settings configuration (only non-Framework7-specific settings)
    settings: {
      language: "nl",
      notifications: true,
      reminders: true,
    },
  };

  f7ready((f7Instance) => {
    // Make f7 globally available for theme switching
    window.f7 = f7Instance;

    // Load and apply saved theme from localStorage
    const savedTheme = localStorage.getItem("mode");
    if (savedTheme === "dark") {
      f7Instance.setDarkMode(true);
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else if (savedTheme === "light") {
      f7Instance.setDarkMode(false);
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }

    // Initialize app data when F7 is ready
    (async () => {
      try {
        await store.dispatch("initializeApp");

        // After app initialization completes, initialize admin status
        // This ensures the auth user is properly loaded before checking admin status
        await store.dispatch("initializeAdminStatus");
      } catch (error) {
        console.error("Error during app/admin initialization:", error);
      }
    })();

    // Start polling for admin status if newAdmin flag is set
    pollAdminStatus();

    // Track page views
    f7Instance.on("pageAfterIn", (page) => {
      ReactGA.send({ hitType: "pageview", page: page.url, title: page.name });
      updateRobotsForRoute(page.url);
    });

    // Debug routing
    f7Instance.on("routeChange", (newRoute, previousRoute) => {});
  });

  // State to manage the active URL
  const [activeUrl, setActiveUrl] = useState(() =>
    typeof window !== "undefined" ? getNormalizedLocationUrl() : "/"
  );

  useEffect(() => {
    const syncActiveUrl = () => {
      setActiveUrl(getNormalizedLocationUrl());
    };

    // Set the initial active URL based on current location (including hybrid path support)
    syncActiveUrl();

    // Listen for popstate events to handle browser back/forward buttons
    window.addEventListener("popstate", syncActiveUrl);

    return () => {
      window.removeEventListener("popstate", syncActiveUrl);
    };
  }, []);

  useEffect(() => {
    updateRobotsForRoute(activeUrl);
  }, [activeUrl]);

  return (
    <HelmetProvider>
      <DataProvider>
        <StudentStatusProvider>
          <AdminStatusProvider>
            <DemoStatusProvider>
              <MaquetteGroupsProvider>
                <MaquetteEventProvider>
                  <App {...f7params}>
                    {/* PWA Install Banner - shows globally when app can be installed */}
                    <PWAInstallBanner position="top" autoShowDelay={10000} />

                    <View
                      main
                      url={activeUrl}
                      browserHistory={true}
                      browserHistoryRoot={BROWSER_HISTORY_ROOT}
                      browserHistorySeparator=""
                    />
                  </App>
                </MaquetteEventProvider>
              </MaquetteGroupsProvider>
            </DemoStatusProvider>
          </AdminStatusProvider>
        </StudentStatusProvider>
      </DataProvider>
    </HelmetProvider>
  );
};

export default MyApp;
