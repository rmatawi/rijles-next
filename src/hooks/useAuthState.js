import { useEffect } from "react";
import store from "../js/store";
import { authService } from "../services";
import {
  setSafeSelectedSchoolId,
} from "../js/utils";
import { adminService } from "../services/adminService";
import { pollAdminStatus } from "../utils/adminUtils";

const useAuthState = () => {
  useEffect(() => {
    // Set up auth state change listener
    const authSubscription = authService.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Initialize admin status FIRST to get admin properties
          let adminProperties = {};
          try {
            const result = await adminService.checkAdminStatus(
              false,
              session.user.email,
              store
            );

            // Extract admin properties to include in the user object
            adminProperties = {
              isAdmin: result.isAdmin,
              admin_status: result.status,
              isAdminForSchool: result.isAdminForSchool,
              schoolIds: result.schoolIds || [],
              adminProfile: result.adminProfile,
            };
          } catch (error) {
            console.error("Error checking admin status:", error);
            // Use default non-admin properties
            adminProperties = {
              isAdmin: false,
              admin_status: null,
              isAdminForSchool: false,
              schoolIds: [],
              adminProfile: null,
            };
          }

          // Include admin properties directly in the user object passed to setAuthState
          const userWithAdminProperties = {
            ...session.user,
            ...adminProperties,
          };

          store.dispatch("setAuthState", {
            isAuthenticated: true,
            user: userWithAdminProperties, // Now includes admin properties!
          });

          // Update the f7 params to reflect the new admin status
          if (window.f7 && window.f7.params) {
            // School-scoped admin access only; status alone is not sufficient.
            window.f7.params.isadmin = !!userWithAdminProperties.isAdmin;
          }

          // If user is a school admin, check if they have access to the currently selected school
          // Only change to admin's default school if no specific school is requested in the URL
          // OR if the URL-specified school is not one of the admin's authorized schools
          // Use a flag to prevent multiple execution during initialization
          let isAdminForSpecificSchool = false; // Track if admin is being set for a specific school

          if (
            adminProperties.isAdminForSchool &&
            Array.isArray(adminProperties.schoolIds) &&
            adminProperties.schoolIds.length > 0
          ) {
            // Check if this admin school assignment has already been processed
            const lastProcessedAdminStatus = sessionStorage.getItem(
              "lastProcessedAdminStatus"
            );
            const currentAuthUserEmail =
              store?.state?.authUser?.email || session?.user?.email;
            const currentStatusKey = currentAuthUserEmail
              ? `${currentAuthUserEmail}-${adminProperties.status}`
              : null;

            if (lastProcessedAdminStatus === currentStatusKey) {
              return;
            }

            // School ID is now handled by background configuration (VITE_REACT_APP_DEFAULTSCHOOL)
            const schoolParam = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

            if (schoolParam) {
              // If there's a school parameter in the URL, try to find it to get its ID for comparison
              try {
                // First try to fetch the school by name to get its ID
                const { data: schoolByName, error: nameError } = await import(
                  "../services/schoolService"
                ).then((module) =>
                  module.schoolService.getSchoolByName(schoolParam)
                );

                if (!nameError && schoolByName) {
                  // If found by name, check if the admin has access to this school
                  const schoolIdFromName = schoolByName.id;
                  const adminHasAccessToRequestedSchool =
                    adminProperties.schoolIds.includes(schoolIdFromName);

                  if (adminHasAccessToRequestedSchool) {
                    // Update localStorage to make sure it's correctly set
                    setSafeSelectedSchoolId(
                      schoolIdFromName,
                      schoolByName.name || schoolParam
                    );
                    isAdminForSpecificSchool = true; // Mark that admin is being set for a specific school
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
                  const { data: schoolById, error: idError } = await import(
                    "../services/schoolService"
                  ).then((module) =>
                    module.schoolService.getSchoolById(schoolParam)
                  );

                  if (!idError && schoolById) {
                    // Check if admin has access to this school
                    const schoolIdFromParam = schoolById.id;
                    const adminHasAccessToRequestedSchool =
                      adminProperties.schoolIds.includes(schoolIdFromParam);

                    if (adminHasAccessToRequestedSchool) {
                      // Update localStorage to make sure it's correctly set
                      setSafeSelectedSchoolId(
                        schoolIdFromParam,
                        schoolById.name || schoolParam
                      );
                      isAdminForSpecificSchool = true; // Mark that admin is being set for a specific school
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
                    const firstSchoolId = adminProperties.schoolIds[0];

                    try {
                      const { schoolService } = await import(
                        "../services/schoolService"
                      );
                      const { data: firstSchool, error } =
                        await schoolService.getSchoolById(firstSchoolId);
                      if (!error && firstSchool) {
                        setSafeSelectedSchoolId(
                          firstSchoolId,
                          firstSchool.name
                        );
                        isAdminForSpecificSchool = true; // Mark that admin is being set for a specific school
                      } else {
                        setSafeSelectedSchoolId(firstSchoolId, firstSchoolId);
                        isAdminForSpecificSchool = true; // Mark that admin is being set for a specific school
                      }
                    } catch (schoolError) {
                      console.error(
                        "Error getting school name for admin:",
                        schoolError
                      );
                      setSafeSelectedSchoolId(firstSchoolId, firstSchoolId);
                      isAdminForSpecificSchool = true; // Mark that admin is being set for a specific school
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
                const firstSchoolId = adminProperties.schoolIds[0];
                isAdminForSpecificSchool = true; // Mark that admin is being set for a specific school

                try {
                  const { schoolService } = await import(
                    "../services/schoolService"
                  );
                  const { data: firstSchool, error } =
                    await schoolService.getSchoolById(firstSchoolId);
                  if (!error && firstSchool) {
                    // School name retrieved but not stored in localStorage
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
                currentSchoolId &&
                adminProperties.schoolIds.includes(currentSchoolId);

              if (!hasAccessToCurrentSchool) {
                // Set the selected school to the first school in the admin's list
                const firstSchoolId = adminProperties.schoolIds[0];


                isAdminForSpecificSchool = true; // Mark that admin is being set for a specific school

                // Also try to get the school name to update localStorage
                try {
                  const { SUPABASE_CONFIG } = await import(
                    "../services/supabase"
                  );
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
                        const schoolName = schoolData[0].name;

                      }
                    }
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

          // Update user profile with Google sign-in metadata
          if (session.user.email) {
            const firstName = session.user.email.split("@")[0];
            store.dispatch("updateUserProfile", {
              name: firstName,
              email: session.user.email, // Add email to the user profile
            });

            // Also update localStorage
            const userData = {
              name: firstName,
              email: session.user.email,
              phone: "",
              memberSince: "",
              avatar: "",
            };
            localStorage.setItem("userProfile", JSON.stringify(userData));

            // Set the selected school ID to the default from environment variable after sign-in
            // ONLY if the user is not an admin for a specific school (to avoid overriding admin assignments)
            if (!isAdminForSpecificSchool) {
              const defaultSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
              if (defaultSchoolId) {
                setSafeSelectedSchoolId(defaultSchoolId);

                // Also try to get the school data to update localStorage and store
                try {
                  const { schoolService } = await import("../services/schoolService");
                  const { data: school, error } = await schoolService.getSchoolById(defaultSchoolId);
                  if (!error && school) {
                    // Update the current school data in the store
                    store.dispatch("updateSchoolData", school);
                  }
                } catch (schoolError) {
                  console.error("Error getting school data for default school:", schoolError);
                }
              }
            }
          }

          // Check for referral code in localStorage and link user if not already linked
          const storedReferralCode = localStorage.getItem("referralCode");
          if (storedReferralCode && session.user.email) {
            import("../services").then(({ accountManagerService }) => {
              accountManagerService
                .linkAdminToAccountManager(
                  storedReferralCode,
                  session.user.email
                )
                .then((result) => {
                  if (result.success) {
                    // Remove the referral code from localStorage after successful linking
                    localStorage.removeItem("referralCode");
                  } else {
                    console.error(
                      "Error linking to account manager on login:",
                      result.error
                    );
                  }
                });
            });
          }

          // Only perform admin-specific redirection if this is an actual sign-in event (not just session check)
          // Check if the adminLoginAttempt flag exists and act accordingly
          const adminLoginAttempt = localStorage.getItem("adminLoginAttempt");
          const currentPage = new URLSearchParams(window.location.search).get(
            "page"
          );

          // Add 1 second timeout before continuing
          setTimeout(async () => {
            // Check if this was an admin login attempt
            if (adminLoginAttempt === "true") {
              // Check admin status using the utility function
              try {
                // Get current email from store for the check
                const currentEmail =
                  store.state.authUser?.email || session.user.email;
                const result = await adminService.checkAdminStatus(
                  true,
                  currentEmail,
                  store
                ); // Use detailed result

                if (result.status === "error") {
                  // There was an actual error with the query (like network error)
                  // Attempt to create an admin record as a backup if the user doesn't have one
                  console.error("Error checking admin status:", result.error);

                  try {
                    // Check if user has an existing admin record first
                    const existingAdmin = await adminService.getAdminByEmail(
                      currentEmail
                    );

                    if (existingAdmin.error) {
                      // If there was an error checking for existing admin, log it but continue
                      console.error(
                        "Error checking for existing admin:",
                        existingAdmin.error
                      );
                    }

                    if (!existingAdmin.data) {
                      // User doesn't have an admin record, create one with pending status
                      const newAdminData = {
                        email: currentEmail,
                        status: "pending",
                        school_ids: [], // Initially empty, can be updated later
                        created_at: new Date().toISOString(),
                      };

                      const { data: createdAdmin, error: createError } =
                        await adminService.createAdmin(newAdminData);

                      if (createError) {
                        console.error(
                          "Error creating admin record:",
                          createError
                        );
                      } else {
                        // Successfully created admin record

                        // Update the user's admin status in the store
                        if (store && store.actions) {
                          const updatedUser = {
                            ...store.state.authUser,
                            isAdmin: false, // Not yet approved
                            admin_status: "pending",
                            isAdminForSchool: false,
                            schoolIds: [],
                            adminProfile: createdAdmin,
                          };

                          store.actions.setAuthState({
                            isAuthenticated: true,
                            user: updatedUser,
                          });
                        }
                      }
                    }
                  } catch (fallbackError) {
                    console.error(
                      "Error in fallback admin creation:",
                      fallbackError
                    );
                  }

                  localStorage.removeItem("adminLoginAttempt");
                  localStorage.setItem("adminNotFound", "true");
                  f7.toast.show({
                    text: "Error checking admin status",
                    position: "top",
                  });
                  // Removed automatic redirect - continue with regular flow without redirect
                } else if (result.status === "approved") {
                  localStorage.removeItem("adminLoginAttempt");
                  // User may be approved globally but still not authorized for a school.
                  if (!result.isAdmin || !result.isAdminForSchool) {
                    f7.toast.show({
                      text: "Je probeerde als admin in te loggen, maar je admin-toegang is nog niet geactiveerd voor een rijschool.",
                      position: "top",
                    });
                    localStorage.setItem("adminNotApprovedYet", "true");
                  } else {
                    localStorage.removeItem("adminNotApprovedYet");
                  }
                  // User is approved and has school access, no automatic redirect - let user navigate manually

                  // Update the user's admin status in the store
                  if (store && store.actions) {
                    const updatedUser = {
                      ...store.state.authUser,
                      isAdmin: result.isAdmin,
                      admin_status: result.status, // "approved"
                      isAdminForSchool: result.isAdminForSchool,
                      schoolIds: result.schoolIds || [],
                      adminProfile: result.adminProfile,
                    };

                    store.actions.setAuthState({
                      isAuthenticated: true,
                      user: updatedUser,
                    });

                    // Update persistent admin status
                    if (
                      store.actions &&
                      store.actions.updatePersistentAdminStatus
                    ) {
                      store.actions.updatePersistentAdminStatus(store.state, {
                        isAdmin: result.isAdmin,
                        adminStatus: result.status, // "approved"
                        isAdminForSchool: result.isAdminForSchool,
                        adminSchoolIds: result.schoolIds || [],
                      });
                    }
                  }
                } else if (result.status === "pending") {
                  localStorage.removeItem("adminLoginAttempt");
                  // User's request is pending
                  f7.toast.show({
                    text: "Your admin request is pending approval",
                    position: "top",
                  });

                  // Update the user's admin status in the store
                  if (store && store.actions) {
                    const updatedUser = {
                      ...store.state.authUser,
                      isAdmin: result.isAdmin,
                      admin_status: result.status, // "pending"
                      isAdminForSchool: result.isAdminForSchool,
                      schoolIds: result.schoolIds || [],
                      adminProfile: result.adminProfile,
                    };

                    store.actions.setAuthState({
                      isAuthenticated: true,
                      user: updatedUser,
                    });

                    // Update persistent admin status
                    if (
                      store.actions &&
                      store.actions.updatePersistentAdminStatus
                    ) {
                      store.actions.updatePersistentAdminStatus(store.state, {
                        isAdmin: result.isAdmin,
                        adminStatus: result.status, // "pending"
                        isAdminForSchool: result.isAdminForSchool,
                        adminSchoolIds: result.schoolIds || [],
                      });
                    }
                  }
                  // Removed automatic redirect - user must navigate manually to check status
                } else {
                  // User is not an approved admin and doesn't have an existing record - create one with pending status
                  // Check if user has an existing admin record first by calling the admin service
                  const existingAdmin = await adminService.getAdminByEmail(
                    currentEmail
                  );

                  if (existingAdmin.error) {
                    // If there was an error checking for existing admin, log it but continue
                    console.error(
                      "Error checking for existing admin:",
                      existingAdmin.error
                    );
                  }

                  if (!existingAdmin.data) {
                    // User doesn't have an admin record, create one with pending status
                    const newAdminData = {
                      email: currentEmail,
                      status: "pending",
                      school_ids: [], // Initially empty, can be updated later
                      created_at: new Date().toISOString(),
                    };

                    const { data: createdAdmin, error: createError } =
                      await adminService.createAdmin(newAdminData);

                    if (createError) {
                      console.error(
                        "Error creating admin record:",
                        createError
                      );
                      f7.toast.show({
                        text: "Error creating admin request",
                        position: "top",
                      });
                    } else {
                      // Successfully created admin record
                      f7.toast.show({
                        text: "Admin request submitted successfully",
                        position: "top",
                      });

                      // Update the user's admin status in the store
                      if (store && store.actions) {
                        const updatedUser = {
                          ...store.state.authUser,
                          isAdmin: false, // Not yet approved
                          admin_status: "pending",
                          isAdminForSchool: false,
                          schoolIds: [],
                          adminProfile: createdAdmin,
                        };

                        store.actions.setAuthState({
                          isAuthenticated: true,
                          user: updatedUser,
                        });

                        // Update persistent admin status
                        if (
                          store.actions &&
                          store.actions.updatePersistentAdminStatus
                        ) {
                          store.actions.updatePersistentAdminStatus(
                            store.state,
                            {
                              isAdmin: false,
                              adminStatus: "pending",
                              isAdminForSchool: false,
                              adminSchoolIds: [],
                            }
                          );
                        }
                      }
                    }
                  }
                }
              } catch (error) {
                localStorage.removeItem("adminLogin");
                localStorage.setItem("adminNotFound");
                console.error("Error checking admin status:", error);
                f7.toast.show({
                  text: "Error checking admin status: " + error.message,
                  position: "top",
                });
                // Continue with regular flow
                // Removed automatic redirect when currentPage is auth
                // User stays on current page without automatic navigation
              }
            }
            // If there's no admin login attempt flag, user might be returning to an existing session
            // Removed automatic redirect - don't redirect away from any page
            // For all pages, don't redirect - let the user stay where they are
          }, 1000); // 1 second timeout

          // Start polling for admin status if newAdmin flag is set
          // This will be called both on sign-in and on the initial check
          // Use window.f7 which should be available after f7ready is complete
          setTimeout(() => {
            pollAdminStatus(); // Now f7 should be available
          }, 100); // Small delay to ensure f7 instance is ready
        } else if (event === "SIGNED_OUT") {
          // Reset auth state and clear admin status
          store.dispatch("setAuthState", {
            isAuthenticated: false,
            user: null,
          });

          // Update the f7 params to reflect the signed out admin status
          if (window.f7 && window.f7.params) {
            window.f7.params.isadmin = false;
          }

          // Explicitly clear admin-related properties to prevent stale data
          if (store.state.authUser) {
            store.state.authUser.isAdmin = false;
            store.state.authUser.admin_status = null;
            store.state.authUser.adminProfile = null;
            store.state.authUser.isAdminForSchool = false;
            store.state.authUser.schoolIds = [];
          }

          // Clear school selection data
          localStorage.removeItem("selectedSchoolId");
          localStorage.removeItem("selectedSchoolName");

          // Check if this was a student session
          const isStudentInvite = localStorage.getItem("isInvite") === "true";
          if (isStudentInvite) {
            // Clear student-specific data
            localStorage.removeItem("isInvite");
            localStorage.removeItem("inviteSchool");
            localStorage.removeItem("studentData");
            localStorage.removeItem("studentRecord");
            // Removed automatic redirect after sign out - user stays on current page
          }
        }
      }
    );

    // Clean up subscription on unmount
    return () => {
      if (authSubscription?.unsubscribe) {
        authSubscription.unsubscribe();
      }
    };
  }, []);
};

export default useAuthState;
