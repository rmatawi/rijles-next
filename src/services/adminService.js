// src/services/adminService.js
import { SUPABASE_CONFIG } from "./supabase";
import {
  setSafeSelectedSchoolId,
  isSuperAdmin,
} from "../js/utils";

// Admin operations using fetch API instead of Supabase client
export const adminService = {
  // Create a new admin
  createAdmin: async (adminData) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to create admin
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_admins`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          ...adminData,
          school_ids: adminData.school_ids || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error("Error creating admin:", error);
      return { data: null, error };
    }
  },

  // Get admin by email
  getAdminByEmail: async (email) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to get admin by email
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?email=eq.${encodeURIComponent(
          email
        )}&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        // If no rows returned, it's not an error - just return null
        if (response.status === 406 || response.status === 200) {
          const data = await response.json();
          return {
            data: Array.isArray(data) && data.length > 0 ? data[0] : null,
            error: null,
          };
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : null,
        error: null,
      };
    } catch (error) {
      console.error(`Error fetching admin with email ${email}:`, error);
      return { data: null, error };
    }
  },

  // Get admin by alias
  getAdminByAlias: async (alias) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      const normalizedAlias = String(alias || "").trim().toLowerCase();
      if (!normalizedAlias) {
        return { data: null, error: null };
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?alias=ilike.${encodeURIComponent(
          normalizedAlias
        )}&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 406 || response.status === 200) {
          const data = await response.json();
          return {
            data: Array.isArray(data) && data.length > 0 ? data[0] : null,
            error: null,
          };
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : null,
        error: null,
      };
    } catch (error) {
      console.error(`Error fetching admin with alias ${alias}:`, error);
      return { data: null, error };
    }
  },

  // Get admin by ID
  getAdminById: async (id) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to get admin by ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?id=eq.${id}&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error(`Error fetching admin with id ${id}:`, error);
      return { data: null, error };
    }
  },

  // Get all admins
  getAllAdmins: async () => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to get all admins
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?order=created_at.desc&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching admins:", error);
      return { data: null, error };
    }
  },

  // Get admins by status
  getAdminsByStatus: async (status) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to get admins by status
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?status=eq.${status}&order=created_at.desc&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error(`Error fetching admins with status ${status}:`, error);
      return { data: null, error };
    }
  },

  // Update an admin
  updateAdmin: async (id, adminData) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to update admin
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?id=eq.${id}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(adminData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error(`Error updating admin ${id}:`, error);
      return { data: null, error };
    }
  },

  // Update admin status
  updateAdminStatus: async (id, status) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to update admin status
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?id=eq.${id}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error(`Error updating admin status ${id}:`, error);
      return { data: null, error };
    }
  },

  // Delete an admin
  deleteAdmin: async (id) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to delete admin
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?id=eq.${id}`,
        {
          method: "DELETE",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return { error: null };
    } catch (error) {
      console.error(`Error deleting admin ${id}:`, error);
      return { error };
    }
  },

  // Check admin status for a user by email
  checkAdminStatus: async (
    detailed = false,
    userEmailOverride = null,
    store = null // Optional store parameter
  ) => {
    try {
      // Get Supabase configuration for fetch request
      // Access environment variables directly through import.meta
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Get user email from either override parameter or f7 store
      const userEmail = userEmailOverride || store?.state?.authUser?.email;

      if (!userEmail) {
        if (store && store.actions) {
          // Create updated user object with admin properties set to false/null
          const updatedUser = {
            ...store.state.authUser, // Preserve existing properties
            email: null, // No email for non-authenticated user
            isAdmin: false,
            admin_status: null,
            adminProfile: null,
            isAdminForSchool: false, // Reset school admin status
            schoolIds: [], // Reset school IDs
          };

          store.actions.setAuthState({
            isAuthenticated: false,
            user: updatedUser,
          });

          // Update persistent admin status for non-authenticated users
          if (store.actions && store.actions.updatePersistentAdminStatus) {
            store.actions.updatePersistentAdminStatus(store.state, {
              isAdmin: false,
              adminStatus: null,
              isAdminForSchool: false,
              adminSchoolIds: [],
            });
          }
        }

        if (detailed) {
          return {
            isAdmin: false,
            isAdminForSchool: false,
            schoolIds: [],
            user: null,
            status: "not_authenticated",
            message: "User is not authenticated",
          };
        } else {
          return {
            isAdmin: false,
            isAdminForSchool: false,
            schoolIds: [],
            user: null,
          };
        }
      }

      // Special case: Super admin is always an admin
      const isSuperAdminCheck = isSuperAdmin(userEmail);

      if (isSuperAdminCheck) {
        // First, try to get the admin's school_ids from the database
        let schoolIds = [];
        try {
          const adminResponse = await fetch(
            `${supabaseUrl}/rest/v1/drv_admins?email=eq.${encodeURIComponent(userEmail)}&select=school_ids`,
            {
              method: "GET",
              headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          if (adminResponse.ok) {
            const adminData = await adminResponse.json();

            if (Array.isArray(adminData) && adminData.length > 0 && adminData[0].school_ids) {
              schoolIds = Array.isArray(adminData[0].school_ids) ? adminData[0].school_ids : [];
            }
          }
        } catch (error) {
          console.error('Error fetching super admin school_ids:', error);
        }

        // Fallback: if no schools found in database, use default school from env
        if (schoolIds.length === 0) {
          const defaultSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
          schoolIds = defaultSchoolId ? [defaultSchoolId] : [];
        }

        // Dispatch the proper store action to update admin status and ensure all components get updated state
        if (store && store.actions) {
          // Create updated user object with admin properties, preserving existing properties
          const updatedUser = {
            ...store.state.authUser, // Preserve existing properties
            email: userEmail, // Ensure email is set correctly
            isAdmin: true,
            admin_status: "approved",
            isAdminForSchool: true, // Default admin has access to all schools
            schoolIds: schoolIds, // Super admin gets default school from env
            adminProfile: {
              email: userEmail,
              status: "approved",
              school_ids: schoolIds, // Super admin gets default school from env
            },
          };

          store.actions.setAuthState({
            isAuthenticated: !!userEmail,
            user: updatedUser,
          });

          // Update persistent admin status for default admin
          if (store.actions && store.actions.updatePersistentAdminStatus) {
            store.actions.updatePersistentAdminStatus(store.state, {
              isAdmin: true,
              adminStatus: "approved",
              isAdminForSchool: true,
              adminSchoolIds: schoolIds,
            });
          }
        }

        // Clear admin status loading state
        if (store && store.actions && store.actions.setAdminStatusLoading) {
          store.actions.setAdminStatusLoading(false);
        }

        if (detailed) {
          return {
            isAdmin: true,
            isAdminForSchool: true,
            schoolIds: schoolIds,
            user: { email: userEmail }, // Use email from store instead of session user
            status: "approved",
            message: "Super admin user",
            isDefaultAdmin: true,
          };
        } else {
          return {
            isAdmin: true,
            isAdminForSchool: true,
            schoolIds: schoolIds,
            user: { email: userEmail }, // Use email from store instead of session user
            status: "approved",
          };
        }
      }

      // Regular admin check: Directly query the drv_admins table to check if user has admin status using fetch API
      // Make fetch request to Supabase REST API
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?email=eq.${encodeURIComponent(
          userEmail
        )}&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      let adminProfile = null;

      if (Array.isArray(data) && data.length > 0) {
        adminProfile = data[0]; // Get the first result
      } else if (response.status === 200) {
        // No results found but request was successful
        adminProfile = null;
      }

      // Error checking is now handled differently with fetch API
      if (adminProfile) {
        // Admin record exists, check both general admin status and school admin status
        const schoolIds = Array.isArray(adminProfile.school_ids)
          ? adminProfile.school_ids
          : [];
        const isApprovedAdmin = adminProfile.status === "approved";

        // School-scoped admin: approved AND at least one assigned school
        const isAdminForSchool = isApprovedAdmin && schoolIds.length > 0;
        const isAdminResult = isAdminForSchool;

        // If admin is approved and newSchool is in localStorage, look up the school record
        let schoolId = null;
        let schoolName = null;
        if (isApprovedAdmin && localStorage.getItem("newSchool")) {
          // Get school name from localStorage
          const newSchoolName = localStorage.getItem("newSchool");

          if (supabaseUrl && supabaseAnonKey) {
            try {
              // Directly query the drv_schools table to find the school by name
              const schoolResponse = await fetch(
                `${supabaseUrl}/rest/v1/drv_schools?name=eq.${encodeURIComponent(
                  newSchoolName
                )}&select=id,name,description,logo_url,cover_image_url,admin_id,created_at,updated_at,address,area,district,details`,
                {
                  method: "GET",
                  headers: {
                    apikey: supabaseAnonKey,
                    Authorization: `Bearer ${supabaseAnonKey}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                }
              );

              if (schoolResponse.ok) {
                const schoolData = await schoolResponse.json();

                if (Array.isArray(schoolData) && schoolData.length > 0) {
                  const schoolRecord = schoolData[0]; // Get the first result
                  schoolId = schoolRecord.id; // Assuming the school record has an 'id' field
                  schoolName = schoolRecord.name; // Store the school name for later use

                  // Set the selected school in localStorage
                  setSafeSelectedSchoolId(schoolId, schoolName);

                  // Remove the newSchool item from localStorage since we've processed it
                  localStorage.removeItem("newSchool");
                }
              }
            } catch (schoolError) {
              console.error("Error looking up school record:", schoolError);
            }
          }
        }

        // Dispatch the proper store action to update admin status and ensure all components get updated state
        if (store && store.actions) {
          // Create updated user object with admin properties, preserving existing properties
          const updatedUser = {
            ...store.state.authUser, // Preserve existing properties
            email: userEmail, // Ensure email is set correctly
            isAdmin: isAdminResult,
            admin_status: adminProfile.status,
            isAdminForSchool: isAdminForSchool,
            schoolIds: schoolIds,
            adminProfile: adminProfile,
          };

          store.actions.setAuthState({
            isAuthenticated: !!userEmail,
            user: updatedUser,
          });

          // Update persistent admin status that survives auth state changes
          if (store.actions && store.actions.updatePersistentAdminStatus) {
            store.actions.updatePersistentAdminStatus(store.state, {
              isAdmin: isAdminResult,
              adminStatus: adminProfile.status,
              isAdminForSchool: isAdminForSchool,
              adminSchoolIds: schoolIds,
            });
          }
        }

        // If user is a school admin, check if they have access to the currently selected school
        // Only change to admin's default school if no specific school is requested in the URL
        // OR if the URL-specified school is not one of the admin's authorized schools
        // Use a flag to prevent multiple execution during initialization
        if (
          isAdminForSchool &&
          Array.isArray(schoolIds) &&
          schoolIds.length > 0
        ) {
          // Check if this admin school assignment has already been processed
          const lastProcessedAdminStatus = sessionStorage.getItem(
            "lastProcessedAdminStatus"
          );
          const currentAuthUserEmail =
            store?.state?.authUser?.email || adminProfile?.email;
          const currentStatusKey = currentAuthUserEmail
            ? `${currentAuthUserEmail}-${adminProfile?.status}`
            : null;

          if (lastProcessedAdminStatus === currentStatusKey) {
            return {
              isAdmin: isAdminResult,
              isAdminForSchool: isAdminForSchool,
              schoolIds: schoolIds,
              user: { email: userEmail },
              status: adminProfile.status,
              adminProfile: adminProfile,
              schoolId: schoolId,
              schoolName: schoolName,
            };
          }

          const schoolParam = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

          if (schoolParam) {
            // If there's a school parameter in the URL, try to find it to get its ID for comparison
            try {
              // First try to fetch the school by name to get its ID
              const schoolServiceModule = await import("./schoolService");
              const schoolService =
                schoolServiceModule.schoolService ||
                (await import("../services/schoolService")).schoolService;
              const { data: schoolByName, error: nameError } =
                await schoolService.getSchoolByName(schoolParam);

              if (!nameError && schoolByName) {
                // If found by name, check if the admin has access to this school
                const schoolIdFromName = schoolByName.id;
                const adminHasAccessToRequestedSchool =
                  schoolIds.includes(schoolIdFromName);

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
                  const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
                  if (
                    !currentSchoolId ||
                    currentSchoolId !== schoolIdFromName
                  ) {
                    setSafeSelectedSchoolId(
                      schoolIdFromName,
                      schoolByName.name || schoolParam
                    );
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
                // If not found by name, try by ID directly
                const { data: schoolById, error: idError } =
                  await schoolService.getSchoolById(schoolParam);

                if (!idError && schoolById) {
                  // Check if admin has access to this school
                  const schoolIdFromParam = schoolById.id;
                  const adminHasAccessToRequestedSchool =
                    schoolIds.includes(schoolIdFromParam);

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
                    const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
                    if (
                      !currentSchoolId ||
                      currentSchoolId !== schoolIdFromParam
                    ) {
                      setSafeSelectedSchoolId(
                        schoolIdFromParam,
                        schoolById.name || schoolParam
                      );
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
                  // If we can't find the school mentioned in the URL, default to first admin school
                  const firstSchoolId = schoolIds[0];

                  try {
                    const { data: firstSchool, error } =
                      await schoolService.getSchoolById(firstSchoolId);
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
              const firstSchoolId = schoolIds[0];
              setSafeSelectedSchoolId(
                firstSchoolId,
                firstSchool?.name || firstSchoolId
              );

              try {
                const schoolServiceModule = await import("./schoolService");
                const schoolService =
                  schoolServiceModule.schoolService ||
                  (await import("../services/schoolService")).schoolService;
                const { data: firstSchool, error } =
                  await schoolService.getSchoolById(firstSchoolId);
                if (!error && firstSchool) {
                  // School name already set via the safe function above
                }
              } catch (schoolError) {
                console.error(
                  "Error getting school name for admin:",
                  schoolError
                );
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
              currentSchoolId && schoolIds.includes(currentSchoolId);

            if (!hasAccessToCurrentSchool) {
              // Set the selected school to the first school in the admin's list
              const firstSchoolId = schoolIds[0];

              // Also try to get the school name to update localStorage
              let schoolName = null;
              try {
                // Access environment variables from centralized configuration
                const { SUPABASE_CONFIG } = await import("./supabase");
                const supabaseUrl = SUPABASE_CONFIG.URL;
                const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

                if (supabaseUrl && supabaseAnonKey) {
                  // Directly query the drv_schools table to find the school by ID
                  const schoolResponse = await fetch(
                    `${supabaseUrl}/rest/v1/drv_schools?id=eq.${firstSchoolId}&select=name`,
                    {
                      method: "GET",
                      headers: {
                        apikey: supabaseAnonKey,
                        Authorization: `Bearer ${supabaseAnonKey}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                      },
                    }
                  );

                  if (schoolResponse.ok) {
                    const schoolData = await schoolResponse.json();
                    if (Array.isArray(schoolData) && schoolData.length > 0) {
                      schoolName = schoolData[0].name;
                      console.log("Retrieved school name:", schoolName);
                    }
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

        if (detailed) {
          return {
            isAdmin: isAdminResult,
            isAdminForSchool: isAdminForSchool,
            schoolIds: schoolIds,
            user: { email: userEmail }, // Use email from store instead of session user
            status: adminProfile.status,
            message: `Admin status is ${adminProfile.status}`,
            adminProfile: adminProfile,
            schoolId: schoolId, // Include the found school ID
            schoolName: schoolName, // Include the found school name
          };
        } else {
          return {
            isAdmin: isAdminResult,
            isAdminForSchool: isAdminForSchool,
            schoolIds: schoolIds,
            user: { email: userEmail }, // Use email from store instead of session user
            status: adminProfile.status,
            adminProfile: adminProfile,
            schoolId: schoolId, // Include the found school ID
            schoolName: schoolName, // Include the found school name
          };
        }
      } else {
        // No admin record found for this user

        // Dispatch the proper store action to update admin status and ensure all components get updated state
        if (store && store.actions) {
          // Create updated user object with admin properties set to false/null, preserving existing properties
          const updatedUser = {
            ...store.state.authUser, // Preserve existing properties
            email: userEmail, // Ensure email is set correctly
            isAdmin: false,
            admin_status: null,
            adminProfile: null,
            isAdminForSchool: false,
            schoolIds: [],
          };

          store.actions.setAuthState({
            isAuthenticated: !!userEmail,
            user: updatedUser,
          });

          // Update persistent admin status for non-admin users
          if (store.actions && store.actions.updatePersistentAdminStatus) {
            store.actions.updatePersistentAdminStatus(store.state, {
              isAdmin: false,
              adminStatus: null,
              isAdminForSchool: false,
              adminSchoolIds: [],
            });
          }
        }

        if (detailed) {
          return {
            isAdmin: false,
            isAdminForSchool: false,
            schoolIds: [],
            user: { email: userEmail }, // Use email from store instead of session user
            status: "not_requested",
            message: "User has not requested admin access",
            adminProfile: null,
          };
        } else {
          return {
            isAdmin: false,
            isAdminForSchool: false,
            schoolIds: [],
            user: { email: userEmail }, // Use email from store instead of session user
            status: null,
          };
        }
      }
    } catch (error) {
      console.error("Error checking admin status:", error);

      // Clear admin status loading state in case of error
      if (store && store.actions && store.actions.setAdminStatusLoading) {
        store.actions.setAdminStatusLoading(false);
      }

      // Dispatch the proper store action to update admin status (fallback to false on error)
      if (store && store.actions) {
        // Create updated user object with admin properties set to false/null, preserving existing properties
        const updatedUser = {
          ...store.state.authUser, // Preserve existing properties
          isAdmin: false,
          admin_status: null,
          adminProfile: null,
          isAdminForSchool: false,
          schoolIds: [],
        };

        store.actions.setAuthState({
          isAuthenticated: false,
          user: updatedUser,
        });

        // Update persistent admin status after exception
        if (store.actions && store.actions.updatePersistentAdminStatus) {
          store.actions.updatePersistentAdminStatus(store.state, {
            isAdmin: false,
            adminStatus: null,
            isAdminForSchool: false,
            adminSchoolIds: [],
          });
        }
      }

      if (detailed) {
        return {
          isAdmin: false,
          isAdminForSchool: false,
          schoolIds: [],
          user: null,
          status: "error",
          message: "Error checking admin status",
          error: error,
        };
      } else {
        return {
          isAdmin: false,
          isAdminForSchool: false,
          schoolIds: [],
          user: null,
          error,
        };
      }
    }
  },

  // Check if user is an admin for a specific school using store state
  // Usage: Requires framework7 store with authUser state
  isAdminForSchool: (schoolId, store = null) => {
    if (!store) {
      console.error("Store is required for isAdminForSchool function");
      return false;
    }

    // Super admin has access to everything
    if (isSuperAdmin(store.state.authUser?.email)) {
      return true;
    }

    // Use store getters which are the single source of truth for admin status
    if (
      store.getters &&
      store.getters.isAdminForSchool &&
      store.getters.adminSchoolIds &&
      typeof store.getters.isAdminForSchool === "function" &&
      typeof store.getters.adminSchoolIds === "function"
    ) {
      try {
        const isSchoolAdmin = store.getters.isAdminForSchool({
          state: store.state,
        });
        const schoolIds = store.getters.adminSchoolIds({ state: store.state });

        // If user is an admin for schools and has this school in their list
        if (isSchoolAdmin && Array.isArray(schoolIds)) {
          return schoolIds.includes(schoolId);
        }
      } catch (error) {
        // Silently handle errors and fallback to other methods
      }
    }

    // Fallback: check the state directly
    const authUser = store.state.authUser;

    // Super admin fallback
    if (isSuperAdmin(authUser?.email)) {
      return true;
    }

    // Check if the user is a regular admin and has this school assigned using the stored schoolIds
    if (authUser?.isAdmin && Array.isArray(authUser?.schoolIds)) {
      return authUser.schoolIds.includes(schoolId);
    }

    return false;
  },

  // Check if admin has access to a specific school using admin data directly (decoupled from store)
  // Usage: Can be used without framework7 store, just requires admin data object with school_ids array
  isAdminForSpecificSchool: (schoolId, adminData) => {
    // If no admin data provided, return false
    if (!adminData) {
      return false;
    }

    // Check if the user is a super admin
    if (isSuperAdmin(adminData.email)) {
      return true;
    }

    // Check if admin has school_ids array and if the specific schoolId is included
    if (adminData.school_ids && Array.isArray(adminData.school_ids)) {
      return adminData.school_ids.includes(schoolId);
    }

    return false;
  },

  // Get admins by school ID
  getAdminsBySchoolId: async (schoolId) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to get admins by school ID
      // This assumes admins have a school_ids array field containing the schools they manage
      // Use the correct Supabase syntax for array containment: school_ids=cs.["school_id"]
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?school_ids=cs.[\"${schoolId}\"]&status=eq.approved&select=*`,
        {
          method: "GET",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching admins by school ID:", error);
      return { data: null, error };
    }
  },
};
