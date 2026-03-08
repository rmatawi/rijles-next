// src/services/instructorService.js
// Service for managing instructor selection and persistence

/**
 * Standard localStorage keys for instructor management
 */
const STORAGE_KEYS = {
  SELECTED_INSTRUCTOR: 'selectedInstructorId', // Primary instructor ID
  SCHOOL_INSTRUCTOR_PREFIX: 'schoolInstructor_', // School-specific: schoolInstructor_${schoolId}
  INVITE_ADMIN: 'inviteAdminId', // Instructor from invite/share link
};
const debugLog = () => {};
const getEnvDefaultInstructor = () =>
  process.env.VITE_REACT_APP_DEFAULT_INSTRUCTOR || null;
const ADMIN_REF_QUERY_KEYS = ["admin_id", "admin", "adminid", "admin-id"];
const ADMIN_REF_PATH_KEYS = new Set(["admin_id", "admin", "adminid", "admin-id"]);
const UUID_V4_LIKE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isLikelyUuid = (value) => UUID_V4_LIKE_REGEX.test(String(value || "").trim());

const sanitizeAdminAlias = (value) =>
  String(value || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();

const extractAdminRefFromUrl = (urlValue) => {
  try {
    const url = new URL(urlValue || window.location.href, window.location.origin);
    const params = url.searchParams;

    for (const key of ADMIN_REF_QUERY_KEYS) {
      const paramValue = params.get(key);
      if (paramValue) {
        return { value: paramValue.trim(), source: `query:${key}` };
      }
    }

    const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
    if (segments.length >= 2 && ADMIN_REF_PATH_KEYS.has(segments[0])) {
      return {
        value: decodeURIComponent(segments.slice(1).join("/")).trim(),
        source: `path:${segments[0]}`,
      };
    }

    // Tolerate malformed links like /admin?aliasvalue or /admin_id?aliasvalue
    if (segments.length === 1 && ADMIN_REF_PATH_KEYS.has(segments[0])) {
      const rawSearch = (url.search || "").replace(/^\?/, "");
      const firstToken = rawSearch.split("&").find(Boolean) || "";
      if (firstToken && !firstToken.includes("=")) {
        return { value: decodeURIComponent(firstToken).trim(), source: `bare-query:${segments[0]}` };
      }
    }
  } catch (error) {
    debugLog("extractAdminRefFromUrl:error", {
      message: error?.message || String(error),
      urlValue,
    });
  }

  return { value: null, source: "none" };
};

const resolveAdminReferenceToId = async (adminRef) => {
  const rawValue = String(adminRef || "").trim();
  if (!rawValue) {
    return { adminId: null, source: "empty" };
  }

  if (isLikelyUuid(rawValue)) {
    return { adminId: rawValue, source: "uuid" };
  }

  const normalizedAlias = sanitizeAdminAlias(rawValue);
  if (!normalizedAlias) {
    return { adminId: null, source: "invalid-alias" };
  }

  try {
    const { adminService } = await import("./adminService");
    const { data: adminData, error } = await adminService.getAdminByAlias(normalizedAlias);

    if (!error && adminData?.id) {
      return { adminId: adminData.id, source: "alias" };
    }
  } catch (error) {
    debugLog("resolveAdminReferenceToId:error", {
      message: error?.message || String(error),
      rawValue,
    });
  }

  return { adminId: null, source: "not-found" };
};

/**
 * Set the selected instructor for the app
 * @param {string} instructorId - UUID of the instructor
 * @param {string} schoolId - Optional school ID for school-specific association
 */
const setSelectedInstructor = (instructorId, schoolId = null) => {
  if (!instructorId) {
    console.warn('[InstructorService] Attempted to set null/undefined instructor');
    return;
  }

  // Set primary instructor ID
  localStorage.setItem(STORAGE_KEYS.SELECTED_INSTRUCTOR, instructorId);

  // Only set school-specific if it differs from the global instructor
  // This prevents redundant storage when they're the same
  if (schoolId) {
    const currentGlobal = localStorage.getItem(STORAGE_KEYS.SELECTED_INSTRUCTOR);
    if (currentGlobal !== instructorId) {
      // Different instructor for this school - store it
      const schoolKey = `${STORAGE_KEYS.SCHOOL_INSTRUCTOR_PREFIX}${schoolId}`;
      localStorage.setItem(schoolKey, instructorId);
    } else {
      // Same as global - remove any existing school-specific entry to avoid redundancy
      const schoolKey = `${STORAGE_KEYS.SCHOOL_INSTRUCTOR_PREFIX}${schoolId}`;
      localStorage.removeItem(schoolKey);
    }
  }
};

/**
 * Get the selected instructor ID
 * Source of truth policy:
 * 1. URL-provided override persisted in localStorage (inviteAdminId)
 * 2. Default instructor from environment
 * No other fallbacks.
 * @param {string} schoolId - Optional school ID to check for school-specific instructor
 * @param {boolean} includeFallback - Whether to include the environment default as fallback
 * @returns {string|null} Instructor ID or null
 */
const getSelectedInstructor = (schoolId = null, includeFallback = true) => {
  const inviteInstructorSnapshot = localStorage.getItem(STORAGE_KEYS.INVITE_ADMIN);
  const envDefaultSnapshot = getEnvDefaultInstructor();

  debugLog("getSelectedInstructor:start", {
    schoolId,
    includeFallback,
    inviteInstructorSnapshot,
    envDefaultSnapshot,
  });

  // Priority 1: URL/share-link override persisted in localStorage
  const inviteInstructor = localStorage.getItem(STORAGE_KEYS.INVITE_ADMIN);
  if (inviteInstructor) {
    debugLog("getSelectedInstructor:resolved", {
      source: "invite-admin",
      value: inviteInstructor,
    });
    return inviteInstructor;
  }

  // Priority 2: Default instructor from environment
  if (includeFallback) {
    debugLog("getSelectedInstructor:resolved", {
      source: "env-default",
      value: envDefaultSnapshot,
    });
    return envDefaultSnapshot;
  }

  debugLog("getSelectedInstructor:resolved", {
    source: "none",
    value: null,
  });
  return null;
};

/**
 * Append admin_id query parameter to a URL if missing.
 * Keeps existing admin_id untouched.
 * @param {string} url - Base/full URL
 * @param {string|null} adminId - Admin/instructor UUID
 * @returns {string} URL with admin_id when available
 */
const appendAdminIdToUrl = (url, adminId) => {
  if (!url || !adminId) return url;
  if (url.includes("admin_id=")) return url;
  const separator = url.includes("?") ? "&" : "/?";
  return `${url}${separator}admin_id=${adminId}`;
};

/**
 * Resolve current admin's drv_admins ID from auth user context.
 * @param {object|null} authUser
 * @param {object} options
 * @param {boolean} options.fallbackToAuthUserId - Use authUser.id when drv_admins lookup misses
 * @returns {Promise<string|null>}
 */
const getCurrentAdminRecordId = async (
  authUser = null,
  { fallbackToAuthUserId = false } = {},
) => {
  const authUserEmail = authUser?.email || null;
  const authUserId = authUser?.id || null;
  const adminProfileId = authUser?.adminProfile?.id || null;

  debugLog("getCurrentAdminRecordId:start", {
    authUserEmail,
    authUserId,
    adminProfileId,
    fallbackToAuthUserId,
  });

  if (authUserEmail) {
    try {
      const { adminService } = await import("./adminService");
      const { data: adminData, error: adminError } =
        await adminService.getAdminByEmail(authUserEmail);
      if (!adminError && adminData?.id) {
        debugLog("getCurrentAdminRecordId:resolved", {
          source: "drv_admins_by_email",
          value: adminData.id,
        });
        return adminData.id;
      }
    } catch (error) {
      debugLog("getCurrentAdminRecordId:error", {
        authUserEmail,
        message: error?.message || String(error),
      });
    }
  }

  if (adminProfileId) {
    debugLog("getCurrentAdminRecordId:resolved", {
      source: "auth_user_adminProfile_id",
      value: adminProfileId,
    });
    return adminProfileId;
  }

  if (fallbackToAuthUserId && authUserId) {
    debugLog("getCurrentAdminRecordId:resolved", {
      source: "auth_user_id",
      value: authUserId,
    });
    return authUserId;
  }

  debugLog("getCurrentAdminRecordId:resolved", {
    source: "none",
    value: null,
  });
  return null;
};

/**
 * Centralized admin/instructor selection flow.
 * Priority:
 * 1) URL/share-link localStorage override (inviteAdminId)
 * 2) Environment default instructor
 * No other fallbacks.
 */
const resolveAdminIdForFlow = async ({
  schoolId = null,
  authUser = null,
  prioritizeCurrentAdmin = true,
  includeExplicitInstructor = true,
  includeEnvFallback = true,
  currentAdminFallbackToAuthUserId = false,
  } = {}) => {
  debugLog("resolveAdminIdForFlow:start", {
    schoolId,
    authUserEmail: authUser?.email || null,
    authUserId: authUser?.id || null,
    prioritizeCurrentAdmin,
    includeExplicitInstructor,
    includeEnvFallback,
    currentAdminFallbackToAuthUserId,
  });

  if (prioritizeCurrentAdmin) {
    const currentAdminId = await getCurrentAdminRecordId(authUser, {
      fallbackToAuthUserId: currentAdminFallbackToAuthUserId,
    });

    if (currentAdminId) {
      const result = {
        adminId: currentAdminId,
        source: "current-admin",
      };
      debugLog("resolveAdminIdForFlow:resolved", result);
      return result;
    }
  }

  if (includeExplicitInstructor) {
    const explicitInstructor = getSelectedInstructor(schoolId, false);
    if (explicitInstructor) {
      const result = {
        adminId: explicitInstructor,
        source: "selected-instructor",
      };
      debugLog("resolveAdminIdForFlow:resolved", result);
      return result;
    }
  }

  if (includeEnvFallback) {
    const envDefault = getEnvDefaultInstructor();
    if (envDefault) {
      const result = { adminId: envDefault, source: "env-default" };
      debugLog("resolveAdminIdForFlow:resolved", result);
      return result;
    }
  }

  const result = { adminId: null, source: "none" };
  debugLog("resolveAdminIdForFlow:resolved", result);
  return result;
};

/**
 * Set instructor from URL parameter/reference (for share links)
 * Accepts UUIDs and aliases, resolving aliases to drv_admins.id before storing.
 * @param {string} instructorRef - Instructor/admin UUID or alias from URL
 */
const setInstructorFromUrl = async (instructorRef) => {
  if (!instructorRef) return;
  debugLog("setInstructorFromUrl:start", { instructorRef });

  const { adminId, source } = await resolveAdminReferenceToId(instructorRef);
  if (!adminId) {
    debugLog("setInstructorFromUrl:unresolved", { instructorRef, source });
    return;
  }

  debugLog("setInstructorFromUrl:resolved", { instructorRef, adminId, source });

  // Store as invite admin (temporary until user selects explicitly)
  localStorage.setItem(STORAGE_KEYS.INVITE_ADMIN, adminId);

  // Always set as primary instructor when coming from URL
  localStorage.setItem(STORAGE_KEYS.SELECTED_INSTRUCTOR, adminId);
};

/**
 * Set a specific instructor for a specific school
 * Use this when you want different instructors for different schools
 * @param {string} instructorId - UUID of the instructor
 * @param {string} schoolId - School ID (required)
 */
const setSchoolSpecificInstructor = (instructorId, schoolId) => {
  if (!instructorId || !schoolId) {
    console.warn('[InstructorService] Both instructorId and schoolId are required');
    return;
  }

  const schoolKey = `${STORAGE_KEYS.SCHOOL_INSTRUCTOR_PREFIX}${schoolId}`;
  localStorage.setItem(schoolKey, instructorId);
};

/**
 * Clear instructor selection
 * @param {string} schoolId - Optional: clear only school-specific instructor
 */
const clearInstructor = (schoolId = null) => {
  if (schoolId) {
    // Clear only school-specific
    const schoolKey = `${STORAGE_KEYS.SCHOOL_INSTRUCTOR_PREFIX}${schoolId}`;
    localStorage.removeItem(schoolKey);
  } else {
    // Clear all
    localStorage.removeItem(STORAGE_KEYS.SELECTED_INSTRUCTOR);
    localStorage.removeItem(STORAGE_KEYS.INVITE_ADMIN);
  }
};

/**
 * Get instructor ID for share URL generation
 * Returns the most appropriate instructor to include in share links
 * @param {string} schoolId - School ID for context
 * @returns {string|null} Instructor ID or null
 */
const getInstructorForShare = (schoolId = null) => {
  return getSelectedInstructor(schoolId);
};

/**
 * Check if an instructor is currently selected
 * @param {string} schoolId - Optional school ID to check
 * @returns {boolean}
 */
const hasSelectedInstructor = (schoolId = null) => {
  return !!getSelectedInstructor(schoolId);
};

export const instructorService = {
  setSelectedInstructor,
  getSelectedInstructor,
  setInstructorFromUrl,
  setSchoolSpecificInstructor,
  clearInstructor,
  getInstructorForShare,
  hasSelectedInstructor,
  appendAdminIdToUrl,
  getCurrentAdminRecordId,
  resolveAdminIdForFlow,
  extractAdminRefFromUrl,
  resolveAdminReferenceToId,
  STORAGE_KEYS,
};

export default instructorService;
