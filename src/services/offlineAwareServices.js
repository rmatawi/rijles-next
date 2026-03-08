// src/services/offlineAwareServices.js
// Offline-aware wrappers for all services

import {
  withOfflineSupport,
  CACHE_KEYS,
  CACHE_EXPIRATION,
} from "./dataSyncService";

/**
 * Offline-aware School Service
 * Wraps schoolService methods with automatic offline support
 */
export const offlineSchoolService = {
  /**
   * Get all schools with offline support
   */
  getSchools: async (forceRefresh = false) => {
    const { schoolService } = await import("./schoolService");
    return withOfflineSupport(
      () => schoolService.getSchools(),
      CACHE_KEYS.SCHOOLS_LIST,
      CACHE_EXPIRATION.MEDIUM,
      forceRefresh
    );
  },

  /**
   * Get school by ID with offline support
   */
  getSchoolById: async (id, forceRefresh = false) => {
    const { schoolService } = await import("./schoolService");
    return withOfflineSupport(
      () => schoolService.getSchoolById(id),
      CACHE_KEYS.SCHOOL_DATA + id,
      CACHE_EXPIRATION.MEDIUM,
      forceRefresh
    );
  },

  /**
   * Get school by name with offline support
   */
  getSchoolByName: async (name, forceRefresh = false) => {
    const { schoolService } = await import("./schoolService");
    return withOfflineSupport(
      () => schoolService.getSchoolByName(name),
      CACHE_KEYS.SCHOOL_DATA + name,
      CACHE_EXPIRATION.MEDIUM,
      forceRefresh
    );
  },

  /**
   * Get schools by IDs with offline support
   */
  getSchoolsByIds: async (schoolIds, forceRefresh = false) => {
    const { schoolService } = await import("./schoolService");
    const cacheKey = CACHE_KEYS.SCHOOLS_LIST + "_" + schoolIds.join("_");
    return withOfflineSupport(
      () => schoolService.getSchoolsByIds(schoolIds),
      cacheKey,
      CACHE_EXPIRATION.MEDIUM,
      forceRefresh
    );
  },

  /**
   * Get schools by admin ID with offline support
   */
  getSchoolsByAdminId: async (adminId, forceRefresh = false) => {
    const { schoolService } = await import("./schoolService");
    const cacheKey = CACHE_KEYS.SCHOOLS_LIST + "_admin_" + adminId;
    return withOfflineSupport(
      () => schoolService.getSchoolsByAdminId(adminId),
      cacheKey,
      CACHE_EXPIRATION.MEDIUM,
      forceRefresh
    );
  },

  // For write operations (create, update, delete), we need to handle differently
  // These require online connection
  createSchool: async (schoolData) => {
    const { schoolService } = await import("./schoolService");
    const { isOnline } = await import("./dataSyncService");

    if (!isOnline()) {
      return {
        data: null,
        error: new Error(
          "Cannot create school while offline. Please check your connection."
        ),
      };
    }

    return schoolService.createSchool(schoolData);
  },

  createSchoolForAdmin: async (schoolData, adminEmail) => {
    const { schoolService } = await import("./schoolService");
    const { isOnline } = await import("./dataSyncService");

    if (!isOnline()) {
      return {
        data: null,
        error: new Error(
          "Cannot create school while offline. Please check your connection."
        ),
      };
    }

    return schoolService.createSchoolForAdmin(schoolData, adminEmail);
  },

  updateSchool: async (id, updates) => {
    const { schoolService } = await import("./schoolService");
    const { isOnline, clearCache } = await import("./dataSyncService");

    if (!isOnline()) {
      return {
        data: null,
        error: new Error(
          "Cannot update school while offline. Please check your connection."
        ),
      };
    }

    const result = await schoolService.updateSchool(id, updates);

    // Clear cache to force refresh
    if (result.data && !result.error) {
      clearCache(CACHE_KEYS.SCHOOL_DATA + id);
      clearCache(CACHE_KEYS.SCHOOLS_LIST);
    }

    return result;
  },

  deleteSchool: async (id) => {
    const { schoolService } = await import("./schoolService");
    const { isOnline, clearCache } = await import("./dataSyncService");

    if (!isOnline()) {
      return {
        error: new Error(
          "Cannot delete school while offline. Please check your connection."
        ),
      };
    }

    const result = await schoolService.deleteSchool(id);

    // Clear cache
    if (!result.error) {
      clearCache(CACHE_KEYS.SCHOOL_DATA + id);
      clearCache(CACHE_KEYS.SCHOOLS_LIST);
    }

    return result;
  },
};

/**
 * Offline-aware QA Service
 * Wraps qaService methods with automatic offline support
 */
export const offlineQAService = {
  /**
   * Get QA entries by school ID with offline support
   */
  getQAEntriesBySchoolId: async (schoolId, forceRefresh = false) => {
    const { qaService } = await import("./qaService");
    return withOfflineSupport(
      () => qaService.getQAEntriesBySchoolId(schoolId),
      CACHE_KEYS.QA_ENTRIES + schoolId,
      CACHE_EXPIRATION.LONG,
      forceRefresh
    );
  },

  /**
   * Get QA entry by ID with offline support
   */
  getQAEntryById: async (id, forceRefresh = false) => {
    const { qaService } = await import("./qaService");
    return withOfflineSupport(
      () => qaService.getQAEntryById(id),
      CACHE_KEYS.QA_ENTRIES + "entry_" + id,
      CACHE_EXPIRATION.LONG,
      forceRefresh
    );
  },

  // Write operations require online connection
  createQAEntry: async (qaData) => {
    const { qaService } = await import("./qaService");
    const { isOnline, clearCache } = await import("./dataSyncService");

    if (!isOnline()) {
      return {
        data: null,
        error: new Error(
          "Cannot create QA entry while offline. Please check your connection."
        ),
      };
    }

    const result = await qaService.createQAEntry(qaData);

    // Clear cache to force refresh
    if (result.data && !result.error && qaData.driving_school_id) {
      clearCache(CACHE_KEYS.QA_ENTRIES + qaData.driving_school_id);
    }

    return result;
  },

  updateQAEntry: async (id, updates) => {
    const { qaService } = await import("./qaService");
    const { isOnline, clearCache } = await import("./dataSyncService");

    if (!isOnline()) {
      return {
        data: null,
        error: new Error(
          "Cannot update QA entry while offline. Please check your connection."
        ),
      };
    }

    const result = await qaService.updateQAEntry(id, updates);

    // Clear cache to force refresh
    if (result.data && !result.error) {
      clearCache(CACHE_KEYS.QA_ENTRIES + "entry_" + id);
      // Also clear the school's QA entries cache if available
      if (result.data.driving_school_id) {
        clearCache(CACHE_KEYS.QA_ENTRIES + result.data.driving_school_id);
      }
    }

    return result;
  },

  deleteQAEntry: async (id, schoolId) => {
    const { qaService } = await import("./qaService");
    const { isOnline, clearCache } = await import("./dataSyncService");

    if (!isOnline()) {
      return {
        error: new Error(
          "Cannot delete QA entry while offline. Please check your connection."
        ),
      };
    }

    const result = await qaService.deleteQAEntry(id);

    // Clear cache
    if (!result.error) {
      clearCache(CACHE_KEYS.QA_ENTRIES + "entry_" + id);
      if (schoolId) {
        clearCache(CACHE_KEYS.QA_ENTRIES + schoolId);
      }
    }

    return result;
  },
};

/**
 * Generic offline-aware service wrapper
 * Can be used for any other services
 */
export const createOfflineAwareService = (serviceName, readMethods, writeMethods) => {
  const service = {};

  // Wrap read methods with offline support
  readMethods.forEach((method) => {
    service[method.name] = async (...args) => {
      const serviceModule = await import(/* @vite-ignore */ `./${serviceName}`);
      const actualService = serviceModule[serviceName];

      const forceRefresh = args[args.length - 1] === true;
      const cacheKey = method.cacheKey(...args);

      return withOfflineSupport(
        () => actualService[method.name](...args.slice(0, -1)),
        cacheKey,
        method.expiration || CACHE_EXPIRATION.LONG,
        forceRefresh
      );
    };
  });

  // Wrap write methods with online check
  writeMethods.forEach((methodName) => {
    service[methodName] = async (...args) => {
      const { isOnline, clearCache } = await import("./dataSyncService");

      if (!isOnline()) {
        return {
          data: null,
          error: new Error(
            `Cannot ${methodName} while offline. Please check your connection.`
          ),
        };
      }

      const serviceModule = await import(/* @vite-ignore */ `./${serviceName}`);
      const actualService = serviceModule[serviceName];

      const result = await actualService[methodName](...args);

      // Clear relevant caches after write operations
      if (result.data && !result.error) {
        // You can add specific cache clearing logic here
        clearCache(serviceName + "_cache");
      }

      return result;
    };
  });

  return service;
};

export default {
  offlineSchoolService,
  offlineQAService,
  createOfflineAwareService,
};
