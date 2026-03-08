// components/app.jsx - Refactored version
import { useState, useEffect } from "react";
import { App, View, f7ready, f7 } from "framework7-react";
import ReactGA from "react-ga4";
import { HelmetProvider } from "react-helmet-async";

import routes from "../js/routes";
import store from "../js/store";
import { isAdmin } from "../js/utils";
import { MaquetteGroupsProvider } from "../contexts/MaquetteGroupsContext";
import { AdminStatusProvider } from "../contexts/AdminStatusContext";
import { DemoStatusProvider } from "../contexts/DemoStatusContext";
import { StudentStatusProvider } from "../contexts/StudentStatusContext";
import { MaquetteEventProvider } from "../contexts/MaquetteEventContext";
import { DataProvider } from "../contexts/DataContext";
import { pollAdminStatus } from "../utils/adminUtils";
import { initializeSkinSystem } from '../utils/skinUtils';

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
  "/auth/",
  "/student-login/",
  "/school-selection/",
  "/profile/",
  "/student-access-grant/",
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

const HYBRID_QUERY_PATH_KEYS = new Set([
  "admin",
  "admin_id",
  "adminid",
  "admin-id",
  "page",
  "share",
]);
const ADMIN_QUERY_ALIASES = new Set(["admin", "admin_id", "adminid", "admin-id"]);
const SINGLE_SEGMENT_PAGE_PATHS = new Set([
  "home",
  "profile",
  "maquettebuilder",
  "maquette",
  "maquetteedit",
  "mockexams",
  "mockexamssequenced",
  "single-maquette",
  "qa",
  "verkeersborden",
  "rijscholen",
  "services",
  "insurance",
  "emergency",
  "about",
  "form",
  "dynamic-route",
  "request-and-load",
  "videos",
  "referral",
  "auth",
  "student-login",
  "school-selection",
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
  "offline-demo",
  "pwa-install-demo",
  "campaign",
  "campaign-fresh",
  "superadmin-tools",
  "admin-management",
  "registration-requirements",
  "admin-marketing-guide",
]);

const decodePathValue = (value) => {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
};

const stripAppBasePath = (pathname = "/") => {
  if (!pathname) return "/";
  if (pathname === LEGACY_APP_BASE_PATH) return "/";
  if (pathname.startsWith(`${LEGACY_APP_BASE_PATH}/`)) {
    return pathname.slice(LEGACY_APP_BASE_PATH.length) || "/";
  }
  return pathname;
};

const prefixAppBasePath = (pathAndSearch = "/") => {
  const normalized = pathAndSearch.startsWith("/") ? pathAndSearch : `/${pathAndSearch}`;
  return normalized;
};

const normalizeHybridQueryPathUrl = (pathname = "/", search = "") => {
  const originalUrl = `${pathname || "/"}${search || ""}`;

  try {
    const trimmedPath = (pathname || "/").replace(/^\/+|\/+$/g, "");
    if (!trimmedPath) {
      return { url: originalUrl, changed: false };
    }

    const segments = trimmedPath.split("/").filter(Boolean);
    const [key, ...valueSegments] = segments;

    // Tolerate malformed links like /admin?aliasvalue or /admin_id?aliasvalue
    if (segments.length === 1 && ADMIN_QUERY_ALIASES.has(key)) {
      const rawSearch = (search || "").replace(/^\?/, "");
      if (!rawSearch) {
        return { url: originalUrl, changed: false };
      }

      const tokens = rawSearch.split("&");
      const [firstToken, ...restTokens] = tokens;
      if (!firstToken || firstToken.includes("=")) {
        return { url: originalUrl, changed: false };
      }

      const params = new URLSearchParams(restTokens.filter(Boolean).join("&"));
      params.set("admin_id", decodePathValue(firstToken));
      const query = params.toString();
      return {
        url: query ? `/?${query}` : "/",
        changed: true,
      };
    }

    // Support direct entry for selected single-segment pages on hosts that
    // normalize or mishandle trailing slashes before Framework7 routing runs.
    if (segments.length === 1 && SINGLE_SEGMENT_PAGE_PATHS.has(key)) {
      const params = new URLSearchParams(search || "");
      params.set("page", key);
      const query = params.toString();
      return {
        url: query ? `/?${query}` : "/",
        changed: true,
      };
    }

    if (segments.length < 2) {
      return { url: originalUrl, changed: false };
    }

    if (!HYBRID_QUERY_PATH_KEYS.has(key) || valueSegments.length === 0) {
      return { url: originalUrl, changed: false };
    }

    const params = new URLSearchParams(search || "");
    const normalizedKey = ADMIN_QUERY_ALIASES.has(key) ? "admin_id" : key;
    params.set(normalizedKey, decodePathValue(valueSegments.join("/")));

    const query = params.toString();
    return {
      url: query ? `/?${query}` : "/",
      changed: true,
    };
  } catch (error) {
    return { url: originalUrl, changed: false };
  }
};

const getNormalizedLocationUrl = () => {
  const routePathname = stripAppBasePath(window.location.pathname);
  const { url, changed } = normalizeHybridQueryPathUrl(
    routePathname,
    window.location.search
  );

  if (changed) {
    window.history.replaceState({}, "", prefixAppBasePath(url));
  }

  return url;
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
    const path = stripAppBasePath(parsed.pathname);
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
