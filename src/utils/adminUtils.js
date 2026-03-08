import { f7 } from "framework7-react";
import store from "../js/store";
import { adminService } from "../services";
import {
  setSafeSelectedSchoolId,
} from "../js/utils";
import { SUPABASE_CONFIG } from "../services/supabase";

// Global variable to track active polling interval to prevent multiple polls
let activePollInterval = null;

// Poll for admin status when newAdmin is true in localStorage
export const pollAdminStatus = () => {
  // Check if newAdmin flag is set in localStorage
  const isNewAdmin = localStorage.getItem("newAdmin") === "true";

  if (!isNewAdmin) {
    // If there's an active poll and no newAdmin flag, stop it
    if (activePollInterval) {
      clearInterval(activePollInterval);
      activePollInterval = null;
    }
    return; // No need to poll if not a new admin
  }

  // If polling is already active, don't start a new one
  if (activePollInterval) {
    return;
  }

  // Start polling every 5 seconds
  activePollInterval = setInterval(async () => {
    try {
      const userEmail = store.state.authUser?.email;
      if (!userEmail) {
        console.warn("No user email available for admin status check");
        return;
      }

      const result = await checkAdminStatusForPoll(); // Use direct API call for polling

      // Handle approved, rejected, or continue polling
      if (result.status === "approved" || result.status === "rejected") {
        // Update the store with the new admin status
        if (store && store.actions) {
          // Create updated user object with admin properties, preserving existing properties
          const updatedUser = {
            ...store.state.authUser, // Preserve existing properties
            isAdmin: result.isAdmin,
            admin_status: result.status,
            isAdminForSchool: result.isAdminForSchool,
            schoolIds: result.schoolIds || [],
            adminProfile: result.adminProfile,
          };

          store.actions.setAuthState({
            isAuthenticated: !!store.state.authUser?.email, // Keep user authenticated if they were
            user: updatedUser,
          });

          // Update persistent admin status
          if (store.actions && store.actions.updatePersistentAdminStatus) {
            store.actions.updatePersistentAdminStatus(store.state, {
              isAdmin: result.isAdmin,
              adminStatus: result.status,
              isAdminForSchool: result.isAdminForSchool,
              adminSchoolIds: result.schoolIds || [],
            });
          }
        }

        // If user is now a school admin, check if they have access to the currently selected school
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
            store?.state?.authUser?.email || result.user?.email;
          const currentStatusKey = currentAuthUserEmail
            ? `${currentAuthUserEmail}-${result.status}`
            : null;

          if (lastProcessedAdminStatus === currentStatusKey) {
            return result;
          }

          // const schoolParam = urlParams.get("school"); // Removed dependency on school param
          const schoolParam = null;

          if (schoolParam) {
            // If there's a school parameter in the URL, try to find it to get its ID for comparison
            try {
              // First try to fetch the school by name to get its ID
              const schoolServiceModule = await import(
                "../services/schoolService"
              );
              const { data: schoolByName, error: nameError } =
                await schoolServiceModule.schoolService.getSchoolByName(
                  schoolParam
                );

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
                  await schoolServiceModule.schoolService.getSchoolById(
                    schoolParam
                  );

                if (!idError && schoolById) {
                  // Check if admin has access to this school
                  const schoolIdFromParam = schoolById.id;
                  const adminHasAccessToRequestedSchool =
                    result.schoolIds.includes(schoolIdFromParam);

                  if (adminHasAccessToRequestedSchool) {
                    // Update localStorage to make sure it's correctly set
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
                      await schoolServiceModule.schoolService.getSchoolById(
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
                const schoolServiceModule = await import(
                  "../services/schoolService"
                );
                const { data: firstSchool, error } =
                  await schoolServiceModule.schoolService.getSchoolById(
                    firstSchoolId
                  );
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
              currentSchoolId && result.schoolIds.includes(currentSchoolId);

            if (!hasAccessToCurrentSchool) {
              // Set the selected school to the first school in the admin's list
              const firstSchoolId = result.schoolIds[0];



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

        // Clear the newAdmin flag
        localStorage.removeItem("newAdmin");

        // Clear the polling interval
        clearInterval(activePollInterval);
        activePollInterval = null;

        // Show appropriate dialog based on status
        await showAdminStatusDialog(result.status);
      }
      // If status is not approved or rejected (e.g., pending, not_requested), continue polling
    } catch (error) {
      console.error("Error polling admin status:", error);
    }
  }, 5000); // Poll every 5 seconds

  return activePollInterval;
};

// Helper function to show admin status dialog
export const showAdminStatusDialog = async (status) => {
  // Wait 500ms to ensure f7 is ready
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Close all dialogs
  f7.dialog.close();

  // Wait 500ms
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (status === "approved") {
    // Show success dialog with reload option
    f7.dialog
      .create({
        title: "Admin Access Approved",
        text: "Your admin access has been approved! Welcome to the admin panel.",
        verticalButtons: true,
        buttons: [
          {
            text: "Reload Page",
            color: "green",
            onClick: () => {
              window.location.reload();
            },
          },
        ],
      })
      .open();
  } else if (status === "rejected") {
    // Show rejection dialog
    f7.dialog.alert(
      "Your admin access request has been rejected.",
      "Admin Access Rejected"
    );
  }
};

// Direct API call function for polling
export const checkAdminStatusForPoll = async () => {
  // For polling, we don't update the store since this is a direct API call for polling purposes only
  try {
    // Get user email
    const userEmail = store.state.authUser?.email;

    if (!userEmail) {
      return {
        isAdmin: false,
        isAdminForSchool: false,
        schoolIds: [],
        user: null,
        status: "not_authenticated",
      };
    }

    // Import isSuperAdmin for checking super admin status
    const { isSuperAdmin } = await import('../js/utils');

    // Special case: Super admin is always an admin
    if (isSuperAdmin(userEmail)) {
      return {
        isAdmin: true,
        isAdminForSchool: true,
        schoolIds: [],
        user: { email: userEmail },
        status: "approved",
      };
    }

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

    // Directly query the drv_admins table to check if user has admin status using fetch API
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
    }

    if (adminProfile) {
      // Admin record exists
      const schoolIds = Array.isArray(adminProfile.school_ids)
        ? adminProfile.school_ids
        : [];
      const isApprovedAdmin = adminProfile.status === "approved";
      const isAdminForSchool = isApprovedAdmin && schoolIds.length > 0;
      const isAdminResult = isAdminForSchool;

      // If admin is approved and newSchool is in localStorage, look up the school record
      let schoolId = null;
      let schoolName = null;
      if (isApprovedAdmin && localStorage.getItem("newSchool")) {
        // Get school name from localStorage
        const newSchoolName = localStorage.getItem("newSchool");

        // Access environment variables directly through import.meta
        const supabaseUrl = SUPABASE_CONFIG.URL;
        const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

        if (supabaseUrl && supabaseAnonKey) {
          try {
            // Directly query the drv_schools table to find the school by name
            const schoolResponse = await fetch(
              `${supabaseUrl}/rest/v1/drv_schools?name=eq.${encodeURIComponent(
                newSchoolName
              )}&select=id,name,description,logo_url,cover_image_url,admin_id,created_at,updated_at,address,area,district,details`,
              {
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



                // Remove the newSchool item from localStorage since we've processed it
                localStorage.removeItem("newSchool");
              }
            }
          } catch (schoolError) {
            console.error("Error looking up school record:", schoolError);
          }
        }
      }

      return {
        isAdmin: isAdminResult,
        isAdminForSchool: isAdminForSchool,
        schoolIds: schoolIds,
        user: { email: userEmail },
        status: adminProfile.status,
        adminProfile: adminProfile,
        schoolId: schoolId, // Include the found school ID
        schoolName: schoolName, // Include the found school name
      };
    } else {
      // No admin record found for this user
      return {
        isAdmin: false,
        isAdminForSchool: false,
        schoolIds: [],
        user: { email: userEmail },
        status: "not_requested",
      };
    }
  } catch (error) {
    console.error("Error checking admin status for polling:", error);
    return {
      isAdmin: false,
      isAdminForSchool: false,
      schoolIds: [],
      user: null,
      status: "error",
      error: error,
    };
  }
};
