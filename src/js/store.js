// js/store.js - Streamlined Framework7 store with essential data only
import { createStore } from "framework7/lite";
import { authService } from "../services/authService";
import { setSafeSelectedSchoolId } from "./utils";

const loadUserFromStorage = () => {
  try {
    // Check for name parameter in URL first
    const urlParams = new URLSearchParams(window.location.search);
    const urlName = urlParams.get("name");
    const isInvite = urlParams.get("invite") === "true";
    // const schoolId = urlParams.get("school"); // Removed logic relying on school param

    // Store invite parameters if present
    if (isInvite) {
      localStorage.setItem("isInvite", "true");
    }

    if (urlName) {
      // Use name from URL parameter
      const userData = {
        name: urlName,
        email: "",
        phone: "",
        memberSince: "",
        avatar: "",
      };
      // Save to localStorage for future visits
      localStorage.setItem("userProfile", JSON.stringify(userData));
      return userData;
    }

    // Use name from URL parameter if present
    if (urlName) {
      const userData = {
        name: urlName,
        email: "",
        phone: "",
        memberSince: "",
        avatar: "",
      };
      saveUserToStorage(userData);
      return userData;
    }

    const stored = localStorage.getItem("userProfile");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveUserToStorage = (user) => {
  try {
    localStorage.setItem("userProfile", JSON.stringify(user));
  } catch (e) {
    console.warn("Could not save user profile to storage:", e);
  }
};

const store = createStore({
  state: {
    // ========================
    // USER DATA
    // ========================
    user: loadUserFromStorage() || {
      name: "",
      email: "",
      phone: "",
      memberSince: "",
      avatar: "",
    },

    // ========================
    // AUTHENTICATION STATE
    // ========================
    isAuthenticated: false,
    authUser: null,
    authLoading: true,
    // Admin status properties that persist through auth state changes
    isAdmin: false,
    isAdminForSchool: false,
    adminStatus: null,
    adminSchoolIds: [],

    // ========================
    // SCHOOL DATA
    // ========================
    schoolData: null,
    schoolsList: [],

    // ========================
    // EMERGENCY CONTACTS
    // ========================
    emergencyContacts: {
      emergency: [
        {
          id: 1,
          name: "Politie",
          number: "115",
          description: "Noodnummer politie",
          icon: "shield",
          color: "blue",
        },
        {
          id: 2,
          name: "Brandweer",
          number: "113",
          description: "Noodnummer brandweer",
          icon: "flame",
          color: "red",
        },
        {
          id: 3,
          name: "Ambulance",
          number: "112",
          description: "Noodnummer ambulance",
          icon: "cross",
          color: "green",
        },
        {
          id: 4,
          name: "Kustwacht",
          number: "116",
          description: "Noodnummer kustwacht",
          icon: "waveform",
          color: "teal",
        },
      ],
      important: [
        {
          id: 2,
          name: "Tourist Police",
          number: "+597 451-115",
          description: "Toeristen politie",
          icon: "person",
          color: "purple",
        },
        {
          id: 3,
          name: "Hulpverlening Ziekenhuis",
          number: "+597 478-811",
          description: "Acute medische hulp",
          icon: "heart",
          color: "pink",
        },
        {
          id: 4,
          name: "Wegenwacht",
          number: "+597 800-1234",
          description: "Assistentie bij pech op de weg",
          icon: "wrench",
          color: "gray",
        },
      ],
    },

    // ========================
    // APP STATE
    // ========================
    loading: false,
    error: null,
    networkStatus: "online",
  },

  getters: {
    // User related - with null safety
    userName({ state }) {
      try {
        return state?.user?.name || "";
      } catch (error) {
        return "";
      }
    },

    // User related - with null safety
    userEmail({ state }) {
      try {
        return state?.user?.email || "foo@bar.com";
      } catch (error) {
        return "foo@bar.com";
      }
    },

    // User related - with null safety
    authUser({ state }) {
      try {
        return state?.authUser || {};
      } catch (error) {
        return {};
      }
    },

    // Admin status getters
    isAdmin({ state }) {
      try {
        const { isAdminUser } = require('./utils');
        return !!isAdminUser(state?.authUser);
      } catch (error) {
        return false;
      }
    },

    isAdminForSchool({ state }) {
      try {
        const result = !!state?.authUser?.isAdminForSchool;
        return result;
      } catch (error) {
        return false;
      }
    },

    adminSchoolIds({ state }) {
      try {
        const result = Array.isArray(state?.authUser?.schoolIds)
          ? state.authUser.schoolIds
          : [];
        return result;
      } catch (error) {
        return [];
      }
    },

    adminStatus({ state }) {
      try {
        const result = state?.authUser?.admin_status || null;
        return result;
      } catch (error) {
        return null;
      }
    },

    // Emergency contacts data
    emergencyNumbers({ state }) {
      try {
        return state?.emergencyContacts?.emergency || [];
      } catch (error) {
        return [];
      }
    },

    importantNumbers({ state }) {
      try {
        return state?.emergencyContacts?.important || [];
      } catch (error) {
        return [];
      }
    },

    // Loading and error states - with null safety
    isLoading({ state }) {
      try {
        return state?.loading || false;
      } catch (error) {
        return false;
      }
    },

    hasError({ state }) {
      try {
        return !!state?.error;
      } catch (error) {
        return false;
      }
    },

    isOnline({ state }) {
      try {
        return state?.networkStatus === "online";
      } catch (error) {
        return true; // Default to online
      }
    },

    // Persistent admin status getters
    persistentIsAdmin({ state }) {
      try {
        return state?.isAdmin;
      } catch (error) {
        return false;
      }
    },

    persistentIsAdminForSchool({ state }) {
      try {
        return state?.isAdminForSchool;
      } catch (error) {
        return false;
      }
    },

    persistentAdminStatus({ state }) {
      try {
        return state?.adminStatus;
      } catch (error) {
        return null;
      }
    },

    persistentAdminSchoolIds({ state }) {
      try {
        return state?.adminSchoolIds || [];
      } catch (error) {
        return [];
      }
    },

    // Insurance and auto services categories (these are used but data is loaded elsewhere)
    insuranceCategories({ state }) {
      try {
        // Return default categories since the actual data is loaded elsewhere
        return [
          { id: "auto", name: "Auto", icon: "car" },
          { id: "travel", name: "Reis", icon: "airplane" },
          { id: "cargo", name: "Goederen", icon: "shippingbox" },
          { id: "health", name: "Gezondheid", icon: "heart" },
          { id: "home", name: "Woning", icon: "house" },
        ];
      } catch (error) {
        return [];
      }
    },

    autoServiceCategories({ state }) {
      try {
        // Return default categories since the actual data is loaded elsewhere
        return [
          { id: "mechanic", name: "Monteurs", icon: "wrench" },
          { id: "accessories", name: "Accessoires", icon: "bag" },
          { id: "tires", name: "Banden", icon: "circle" },
          { id: "bodywork", name: "Carrosserie", icon: "paintbrush" },
          { id: "electric", name: "Elektrisch", icon: "bolt" },
        ];
      } catch (error) {
        return [];
      }
    },

    // Insurance providers getter - used in InsurancePage
    insuranceProviders({ state }) {
      try {
        // This would need to be populated by a service call in the actual InsurancePage
        return [];
      } catch (error) {
        return [];
      }
    },

    // Auto services getter - used in ServicesPage
    autoServices({ state }) {
      try {
        // This would need to be populated by a service call in the actual ServicesPage
        return [];
      } catch (error) {
        return [];
      }
    },
  },

  actions: {
    // Loading and error management
    setLoading({ state }, loading) {
      try {
        state.loading = loading;
      } catch (error) {
        // Error handling without console logging
      }
    },

    setError({ state }, error) {
      try {
        state.error = error;
        state.loading = false;
      } catch (err) {
        // Error handling without console logging
      }
    },

    clearError({ state }) {
      try {
        state.error = null;
      } catch (error) {
        // Error handling without console logging
      }
    },

    setNetworkStatus({ state }, status) {
      try {
        state.networkStatus = status;
      } catch (error) {
        console.warn("Error setting network status:", error);
      }
    },

    // update User Profile
    updateUserProfile({ state }, newProfile) {
      try {
        state.user = { ...state.user, ...newProfile };
        saveUserToStorage(state.user); // 💾 persist to localStorage
      } catch (error) {
        console.warn("Error updating user profile:", error);
      }
    },

    // Update school data
    updateSchoolData({ state }, schoolData) {
      try {
        state.schoolData = schoolData;
        if (schoolData) {
          localStorage.setItem("currentSchoolData", JSON.stringify(schoolData));
          // This action is intended to update the current school data when the user switches schools
          // It should update the selected school ID to reflect the new current school
          setSafeSelectedSchoolId(schoolData?.id, schoolData?.name);
        }
      } catch (error) {
        console.warn("Error updating school data:", error);
      }
    },

    // Update schools list
    updateSchoolsList({ state }, schoolsList) {
      try {
        state.schoolsList = schoolsList || [];
        if (schoolsList) {
          localStorage.setItem("schoolsList", JSON.stringify(schoolsList));
        }
      } catch (error) {
        console.warn("Error updating schools list:", error);
      }
    },

    // Authentication actions
    setAuthState({ state }, { isAuthenticated, user }) {
      // Preserve existing admin status properties if new user object doesn't have them
      // This prevents overwriting admin status when user object doesn't include admin properties
      const preservedUser = {
        ...user,
        // Preserve admin properties if they exist in current state but not in new user object
        isAdmin:
          user?.isAdmin !== undefined ? user.isAdmin : state.authUser?.isAdmin,
        admin_status:
          user?.admin_status !== undefined
            ? user.admin_status
            : state.authUser?.admin_status,
        isAdminForSchool:
          user?.isAdminForSchool !== undefined
            ? user.isAdminForSchool
            : state.authUser?.isAdminForSchool,
        schoolIds:
          user?.schoolIds !== undefined
            ? user.schoolIds
            : state.authUser?.schoolIds,
        adminProfile:
          user?.adminProfile !== undefined
            ? user.adminProfile
            : state.authUser?.adminProfile,
      };

      state.isAuthenticated = isAuthenticated;
      state.authUser = preservedUser;
      state.authLoading = false;
    },

    async checkAuthState({ dispatch }) {
      try {
        const { user, error } = await authService.getCurrentUser();

        if (error) {
          console.warn("Error checking auth state:", error);
          dispatch("setAuthState", { isAuthenticated: false, user: null });
          return { isAuthenticated: false, user: null };
        }

        if (user) {
          dispatch("setAuthState", { isAuthenticated: true, user });
          return { isAuthenticated: true, user };
        } else {
          dispatch("setAuthState", { isAuthenticated: false, user: null });
          return { isAuthenticated: false, user: null };
        }
      } catch (error) {
        console.warn("Error checking auth state:", error);
        dispatch("setAuthState", { isAuthenticated: false, user: null });
        return { isAuthenticated: false, user: null };
      }
    },

    async logout({ dispatch, state }) {
      try {
        const { error } = await authService.signOut();

        if (error) {
          console.warn("Error signing out:", error);
          return { success: false, error };
        }

        dispatch("setAuthState", { isAuthenticated: false, user: null });

        // Explicitly clear admin-related properties to prevent stale data
        if (state.authUser) {
          state.authUser.isAdmin = false;
          state.authUser.admin_status = null;
          state.authUser.adminProfile = null;
          state.authUser.isAdminForSchool = false;
          state.authUser.schoolIds = [];
        }

        return { success: true };
      } catch (error) {
        console.warn("Error signing out:", error);
        return { success: false, error };
      }
    },

    // Update persistent admin properties
    updatePersistentAdminStatus(
      { state },
      { isAdmin, adminStatus, isAdminForSchool, adminSchoolIds }
    ) {
      state.isAdmin = isAdmin !== undefined ? isAdmin : state.isAdmin;
      state.adminStatus =
        adminStatus !== undefined ? adminStatus : state.adminStatus;
      state.isAdminForSchool =
        isAdminForSchool !== undefined
          ? isAdminForSchool
          : state.isAdminForSchool;
      state.adminSchoolIds =
        adminSchoolIds !== undefined ? adminSchoolIds : state.adminSchoolIds;
    },

    // Initialize app data
    async initializeApp({ dispatch, state }) {
      dispatch("setLoading", true);
      try {
        // Check authentication state first
        await dispatch("checkAuthState");

        // Load non-framework7-specific settings from localStorage
        const savedLanguage = localStorage.getItem("language");
        const savedNotifications = localStorage.getItem("notifications");
        const savedReminders = localStorage.getItem("reminders");

        // Update custom settings in f7 params based on saved preferences
        if (typeof f7 !== "undefined" && f7.params && f7.params.settings) {
          if (savedLanguage) {
            f7.params.settings.language = savedLanguage;
          }
          if (savedNotifications !== null) {
            f7.params.settings.notifications = JSON.parse(savedNotifications);
          }
          if (savedReminders !== null) {
            f7.params.settings.reminders = JSON.parse(savedReminders);
          }
        }

        // Check network status
        if (navigator.onLine !== undefined) {
          dispatch("setNetworkStatus", navigator.onLine ? "online" : "offline");
        }

        // Set up network status listeners
        if (typeof window !== "undefined") {
          window.addEventListener("online", () =>
            dispatch("setNetworkStatus", "online")
          );
          window.addEventListener("offline", () =>
            dispatch("setNetworkStatus", "offline")
          );
        }

        // Initialize data sync service for online/offline support
        try {
          const { initializeSyncListeners } = await import("../services/dataSyncService");
          initializeSyncListeners();
        } catch (syncError) {
          console.warn("Error initializing data sync service:", syncError);
        }

        dispatch("setLoading", false);
      } catch (error) {
        console.warn("Error initializing app:", error);
        dispatch("setError", "Failed to initialize app");
      }
    },

    // Initialize admin status after auth state is restored
    // This should be called after initializeApp completes
    async initializeAdminStatus({ dispatch, state }) {
      try {
        // Import admin service dynamically to avoid circular dependencies
        const adminServiceModule = await import("../services/adminService");
        const adminService = adminServiceModule.adminService;

        const result = await adminService.checkAdminStatus(false, undefined, {
          state,
          actions: {
            setAuthState: (data) => dispatch("setAuthState", data),
            updatePersistentAdminStatus: (updateData) =>
              dispatch("updatePersistentAdminStatus", updateData),
          },
        });

        // If user is a school admin, check if they have access to the currently selected school
        // Only change to admin's default school if no specific school is requested in the URL
        // OR if the URL-specified school is not one of the admin's authorized schools
        // Use a flag to prevent multiple execution during initialization
        if (
          result.isAdminForSchool &&
          Array.isArray(result.schoolIds) &&
          result.schoolIds.length > 0
        ) {
          // Check if this admin school assignment has already been processed
          const lastProcessedAdminStatus = sessionStorage.getItem(
            "lastProcessedAdminStatus"
          );
          const currentAuthUserEmail =
            state.authUser?.email || result.user?.email;
          const currentStatusKey = currentAuthUserEmail
            ? `${currentAuthUserEmail}-${result.status}`
            : null;

          if (lastProcessedAdminStatus === currentStatusKey) {
            return result;
          }

          // const schoolParam = urlParams.get("school"); // No longer prioritizing school param from URL
          const schoolParam = null;

          if (schoolParam) {
            // If there's a school parameter in the URL, try to find it to get its ID for comparison
            try {
              // First try to fetch the school by name to get its ID
              const schoolService = await import("../services/schoolService");
              const { data: schoolByName, error: nameError } =
                await schoolService.schoolService.getSchoolByName(schoolParam);

              if (!nameError && schoolByName) {
                // If found by name, check if the admin has access to this school
                const schoolIdFromName = schoolByName.id;
                const adminHasAccessToRequestedSchool =
                  result.schoolIds.includes(schoolIdFromName);

                if (adminHasAccessToRequestedSchool) {
                  // Update localStorage to make sure it's correctly set
                  setSafeSelectedSchoolId(
                    schoolIdFromName,
                    schoolByName.name || schoolParam
                  );
                  // Mark this admin status as processed
                  if (currentStatusKey) {
                    sessionStorage.setItem(
                      "lastProcessedAdminStatus",
                      currentStatusKey
                    );
                  }
                } else {
                  // For viewing purposes, don't override the URL parameter
                  // This allows users to view schools they don't manage via URL
                  setSafeSelectedSchoolId(
                    schoolIdFromName,
                    schoolByName.name || schoolParam
                  );
                  // Mark this admin status as processed
                  if (currentStatusKey) {
                    sessionStorage.setItem(
                      "lastProcessedAdminStatus",
                      currentStatusKey
                    );
                  }
                }
              } else {
                // If not found by name, try by ID directly
                const { data: schoolById, error: idError } =
                  await schoolService.schoolService.getSchoolById(schoolParam);

                if (!idError && schoolById) {
                  // Check if admin has access to this school
                  const schoolIdFromParam = schoolById.id;
                  const adminHasAccessToRequestedSchool =
                    result.schoolIds.includes(schoolIdFromParam);

                  if (adminHasAccessToRequestedSchool) {
                    // Update localStorage to make sure it's correctly set
                    setSafeSelectedSchoolId(
                      schoolIdFromParam,
                      schoolById?.name || schoolParam
                    );
                    // Mark this admin status as processed
                    if (currentStatusKey) {
                      sessionStorage.setItem(
                        "lastProcessedAdminStatus",
                        currentStatusKey
                      );
                    }
                  } else {
                    // For viewing purposes, don't override the URL parameter
                    // This allows users to view schools they don't manage via URL
                    setSafeSelectedSchoolId(
                      schoolIdFromParam,
                      schoolById.name || schoolParam
                    );
                    // Mark this admin status as processed
                    if (currentStatusKey) {
                      sessionStorage.setItem(
                        "lastProcessedAdminStatus",
                        currentStatusKey
                      );
                    }
                  }
                } else {
                  // If we can't find the school mentioned in the URL, default to first admin school
                  const firstSchoolId = result.schoolIds[0];

                  try {
                    const { data: firstSchool, error } =
                      await schoolService.schoolService.getSchoolById(
                        firstSchoolId
                      );
                    if (!error && firstSchool) {
                      setSafeSelectedSchoolId(firstSchoolId, firstSchool.name);
                    } else {
                      setSafeSelectedSchoolId(firstSchoolId, firstSchoolId);
                    }
                  } catch (schoolError) {
                    console.error(
                      "Error getting school name for admin:",
                      schoolError
                    );
                    setSafeSelectedSchoolId(firstSchoolId, firstSchoolId);
                  }
                  // Mark this admin status as processed
                  if (currentStatusKey) {
                    sessionStorage.setItem(
                      "lastProcessedAdminStatus",
                      currentStatusKey
                    );
                  }
                }
              }
            } catch (error) {
              console.error(
                "Error resolving school from URL parameter:",
                error
              );
              // If there's an error resolving the school, default to first admin school
              const firstSchoolId = result.schoolIds[0];

              try {
                const schoolService = await import("../services/schoolService");
                const { data: firstSchool, error } =
                  await schoolService.schoolService.getSchoolById(
                    firstSchoolId
                  );
                if (!error && firstSchool) {
                  setSafeSelectedSchoolId(firstSchoolId, firstSchool.name);
                } else {
                  setSafeSelectedSchoolId(firstSchoolId, firstSchoolId);
                }
              } catch (schoolError) {
                console.error(
                  "Error getting school name for admin:",
                  schoolError
                );
                setSafeSelectedSchoolId(firstSchoolId, firstSchoolId);
              }
              // Mark this admin status as processed
              if (currentStatusKey) {
                sessionStorage.setItem(
                  "lastProcessedAdminStatus",
                  currentStatusKey
                );
              }
            }
          } else {
            // No school parameter in URL, default to current or first admin school
            const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

            // Check if the current school is in the admin's assigned schools
            const hasAccessToCurrentSchool =
              currentSchoolId && result.schoolIds.includes(currentSchoolId);

            if (!hasAccessToCurrentSchool) {
              // Set the selected school to the first school in the admin's list
              const firstSchoolId = result.schoolIds[0];

              // Also try to get the school name to update localStorage
              let schoolName = null;
              try {
                const supabaseUrl = await import("../services/supabase");
                const SUPABASE_CONFIG = supabaseUrl.SUPABASE_CONFIG;

                const schoolResponse = await fetch(
                  `${SUPABASE_CONFIG.URL}/rest/v1/drv_schools?id=eq.${firstSchoolId}&select=name`,
                  {
                    headers: {
                      apikey: SUPABASE_CONFIG.ANON_KEY,
                      Authorization: `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
                      "Content-Type": "application/json",
                      Accept: "application/json",
                    },
                  }
                );

                if (schoolResponse.ok) {
                  const schoolData = await schoolResponse.json();
                  if (Array.isArray(schoolData) && schoolData.length > 0) {
                    schoolName = schoolData[0].name;
                  }
                }
              } catch (schoolError) {
                console.error(
                  "Error getting school name for admin:",
                  schoolError
                );
              }

              // Finally, set the school ID and name using the safe function
              setSafeSelectedSchoolId(firstSchoolId, schoolName);
              // Mark this admin status as processed
              if (currentStatusKey) {
                sessionStorage.setItem(
                  "lastProcessedAdminStatus",
                  currentStatusKey
                );
              }
            } else {
              // Mark this admin status as processed
              if (currentStatusKey) {
                sessionStorage.setItem(
                  "lastProcessedAdminStatus",
                  currentStatusKey
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    },
  },
});

export default store;
