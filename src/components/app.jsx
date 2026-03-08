// components/app.jsx - Refactored version
import { Suspense, useEffect, useMemo } from "react";
import { App, View, f7ready } from "framework7-react";
import { usePathname, useSearchParams } from "next/navigation";
import ReactGA from "react-ga4";
import { HelmetProvider } from "react-helmet-async";

import pageRoutes, { notFoundComponent } from "../js/routes";
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

const getPathFromUrl = (urlValue = "/") => {
  const [pathOnly] = String(urlValue || "/").split("?");
  return normalizePath(pathOnly);
};

const resolveRouteComponent = (urlValue = "/") => {
  const targetPath = getPathFromUrl(urlValue);

  const matchedRoute = pageRoutes.find((route) => {
    const routePath = normalizePath(route.path);
    return routePath === targetPath;
  });

  return matchedRoute?.component || notFoundComponent || null;
};

const getNormalizedUrlFromParts = (pathnameInput = "/", searchInput = "") => {
  const pathname = normalizePath(stripAppBasePath(pathnameInput));
  const params = new URLSearchParams(searchInput || "");
  const page = params.get("page");
  let normalizedPath = pathname;

  // Backward compatibility for old links like /?page=profile
  if (normalizedPath === "/" && page) {
    normalizedPath = page === "home" ? "/" : `/${page}`;
    params.delete("page");
  }

  const query = params.toString();
  return query ? `${normalizedPath}?${query}` : normalizedPath;
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

const fallbackBrowserBack = (fallbackPath = "/") => {
  if (typeof window === "undefined") return;

  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.assign(fallbackPath);
};

const patchRouterBack = (router, fallbackPath = "/") => {
  if (!router || typeof router.back !== "function" || router.__safeBackPatched) {
    return;
  }

  const originalBack = router.back.bind(router);

  router.back = (...args) => {
    try {
      return originalBack(...args);
    } catch (error) {
      console.warn("Framework7 router.back failed, using browser fallback.", error);
      fallbackBrowserBack(fallbackPath);
      return undefined;
    }
  };

  router.__safeBackPatched = true;
};

const patchAllViewRouters = (f7Instance, fallbackPath = "/") => {
  if (!f7Instance?.views) return;

  Object.values(f7Instance.views).forEach((view) => {
    if (view?.router) {
      patchRouterBack(view.router, fallbackPath);
    }
  });
};

const scheduleWhenIdle = (callback, timeout = 2000) => {
  if (typeof window === "undefined") return;
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout });
    return;
  }
  window.setTimeout(callback, Math.min(timeout, 1500));
};

const RouteContent = ({ component: Component, activeUrl, f7route }) => {
  if (!Component) return null;
  return (
    <Suspense fallback={null}>
      <Component f7route={f7route} />
    </Suspense>
  );
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
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    f7ready((f7Instance) => {
      patchAllViewRouters(f7Instance, "/");

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

          // Defer non-critical admin bootstrap work so the first route paints faster.
          scheduleWhenIdle(() => {
            store.dispatch("initializeAdminStatus").catch((error) => {
              console.error("Error during deferred admin initialization:", error);
            });

            // Start polling for admin status if newAdmin flag is set.
            pollAdminStatus();
          }, 2500);
        } catch (error) {
          console.error("Error during app/admin initialization:", error);
        }
      })();

      // Track page views
      f7Instance.on("pageAfterIn", (page) => {
        ReactGA.send({ hitType: "pageview", page: page.url, title: page.name });
        updateRobotsForRoute(page.url);
      });

      // Debug routing
      f7Instance.on("routeChange", (newRoute, previousRoute) => {});
    });
  }, []);

  const activeUrl = useMemo(
    () => getNormalizedUrlFromParts(pathname || "/", searchParams?.toString() || ""),
    [pathname, searchParams]
  );

  useEffect(() => {
    updateRobotsForRoute(activeUrl);
  }, [activeUrl]);

  const activeRouteComponent = resolveRouteComponent(activeUrl);
  const activeSearchParams = new URLSearchParams(activeUrl.split("?")[1] || "");
  const activePath = getPathFromUrl(activeUrl);
  const f7route = {
    path: activePath,
    url: activeUrl,
    query: Object.fromEntries(activeSearchParams.entries()),
  };

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
                    >
                      <RouteContent component={activeRouteComponent} activeUrl={activeUrl} f7route={f7route} />
                    </View>
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
