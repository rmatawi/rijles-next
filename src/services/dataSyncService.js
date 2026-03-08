// src/services/dataSyncService.js
// Data synchronization service for online/offline functionality

import store from "../js/store";

/**
 * Data Sync Service
 * Handles automatic syncing between database and localStorage
 * When online: fetches from database and caches to localStorage
 * When offline: reads from localStorage cache
 */

// Cache keys for different data types
export const CACHE_KEYS = {
  SCHOOLS_LIST: "cache_schools_list",
  SCHOOL_DATA: "cache_school_data_",
  QA_ENTRIES: "cache_qa_entries_",
  MAQUETTES: "cache_maquettes_",
  TRAFFIC_RULES: "cache_traffic_rules_",
  YT_VIDEOS: "cache_yt_videos_",
  STUDENT_PROGRESS: "cache_student_progress_",
  USER_PROFILE: "userProfile", // Already exists
  CURRENT_SCHOOL: "currentSchoolData", // Already exists
};

// Cache expiration time (in milliseconds)
export const CACHE_EXPIRATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Check if device is online
 */
export const isOnline = () => {
  return navigator.onLine && store.state.networkStatus === "online";
};

/**
 * Save data to localStorage with timestamp
 */
export const saveToCache = (key, data, expirationTime = CACHE_EXPIRATION.LONG) => {
  try {
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      expirationTime: expirationTime,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
    return true;
  } catch (error) {
    console.warn(`Failed to save to cache: ${key}`, error);
    return false;
  }
};

/**
 * Get data from localStorage if not expired
 */
export const getFromCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const now = Date.now();

    // Check if cache has expired
    if (cacheData.timestamp && cacheData.expirationTime) {
      const age = now - cacheData.timestamp;
      if (age > cacheData.expirationTime) {
        // Cache expired, remove it
        localStorage.removeItem(key);
        return null;
      }
    }

    return cacheData.data;
  } catch (error) {
    console.warn(`Failed to get from cache: ${key}`, error);
    return null;
  }
};

/**
 * Clear specific cache entry
 */
export const clearCache = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to clear cache: ${key}`, error);
    return false;
  }
};

/**
 * Clear all cache entries
 */
export const clearAllCache = () => {
  try {
    Object.values(CACHE_KEYS).forEach((key) => {
      if (typeof key === "string" && key.startsWith("cache_")) {
        // Clear all keys that match the pattern
        const keys = Object.keys(localStorage);
        keys.forEach((storageKey) => {
          if (storageKey.startsWith(key)) {
            localStorage.removeItem(storageKey);
          }
        });
      }
    });
    return true;
  } catch (error) {
    console.warn("Failed to clear all cache", error);
    return false;
  }
};

/**
 * Generic wrapper for service calls with offline support
 * @param {Function} onlineFn - Function to call when online (should return {data, error})
 * @param {string} cacheKey - Key to use for localStorage
 * @param {number} cacheExpiration - Cache expiration time in milliseconds
 * @param {boolean} forceRefresh - Force refresh from database even if cached
 */
export const withOfflineSupport = async (
  onlineFn,
  cacheKey,
  cacheExpiration = CACHE_EXPIRATION.LONG,
  forceRefresh = false
) => {
  // If offline, try to get from cache
  if (!isOnline()) {
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[OFFLINE] Using cached data for: ${cacheKey}`);
      return { data: cachedData, error: null, fromCache: true };
    } else {
      console.warn(`[OFFLINE] No cached data available for: ${cacheKey}`);
      return {
        data: null,
        error: new Error("Offline: No cached data available"),
        fromCache: false,
      };
    }
  }

  // If online, check cache first unless force refresh
  if (!forceRefresh) {
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[ONLINE] Using cached data for: ${cacheKey}`);
      // Return cached data but also refresh in background
      onlineFn()
        .then((result) => {
          if (result.data && !result.error) {
            saveToCache(cacheKey, result.data, cacheExpiration);
          }
        })
        .catch((error) => {
          console.warn(`Background refresh failed for ${cacheKey}:`, error);
        });
      return { data: cachedData, error: null, fromCache: true };
    }
  }

  // Fetch from database
  try {
    console.log(`[ONLINE] Fetching fresh data for: ${cacheKey}`);
    const result = await onlineFn();

    // If successful, cache the data
    if (result.data && !result.error) {
      saveToCache(cacheKey, result.data, cacheExpiration);
    }

    return { ...result, fromCache: false };
  } catch (error) {
    console.error(`Error fetching data for ${cacheKey}:`, error);
    // If online fetch fails, try to get from cache as fallback
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[FALLBACK] Using cached data after fetch error: ${cacheKey}`);
      return { data: cachedData, error: null, fromCache: true };
    }
    return { data: null, error, fromCache: false };
  }
};

/**
 * Sync all critical data when coming back online
 */
export const syncAllData = async () => {

  try {
    // Import services dynamically to avoid circular dependencies
    const { schoolService } = await import("./schoolService");
    const { qaService } = await import("./qaService");
    // Add more services as needed

    // Get current school ID
    const schoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

    // Sync schools list
    try {
      const { data } = await schoolService.getSchools();
      if (data) {
        saveToCache(CACHE_KEYS.SCHOOLS_LIST, data, CACHE_EXPIRATION.MEDIUM);
      }
    } catch (error) {
      console.warn("[SYNC] Failed to sync schools list:", error);
    }

    // Sync current school data
    if (schoolId) {
      try {
        const { data } = await schoolService.getSchoolById(schoolId);
        if (data) {
          saveToCache(
            CACHE_KEYS.SCHOOL_DATA + schoolId,
            data,
            CACHE_EXPIRATION.MEDIUM
          );
        }
      } catch (error) {
        console.warn("[SYNC] Failed to sync school data:", error);
      }

      // Sync QA entries for current school
      try {
        const { data } = await qaService.getQAEntriesBySchoolId(schoolId);
        if (data) {
          saveToCache(
            CACHE_KEYS.QA_ENTRIES + schoolId,
            data,
            CACHE_EXPIRATION.LONG
          );
        }
      } catch (error) {
        console.warn("[SYNC] Failed to sync QA entries:", error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("[SYNC] Error during data synchronization:", error);
    return { success: false, error };
  }
};

/**
 * Initialize sync listeners
 * Set up event listeners for online/offline events
 */
export const initializeSyncListeners = () => {
  // Listen for online event
  window.addEventListener("online", async () => {
    store.dispatch("setNetworkStatus", "online");

    // Wait a bit to ensure connection is stable
    setTimeout(() => {
      syncAllData();
    }, 1000);
  });

  // Listen for offline event
  window.addEventListener("offline", () => {
    store.dispatch("setNetworkStatus", "offline");
  });

  // Initial sync if online
  if (isOnline()) {
    setTimeout(() => {
      syncAllData();
    }, 2000);
  }
};

export default {
  isOnline,
  saveToCache,
  getFromCache,
  clearCache,
  clearAllCache,
  withOfflineSupport,
  syncAllData,
  initializeSyncListeners,
  CACHE_KEYS,
  CACHE_EXPIRATION,
};
