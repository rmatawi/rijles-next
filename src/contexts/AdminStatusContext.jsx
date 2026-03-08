import { useState, useEffect, createContext, useContext, useCallback, useMemo, useRef } from "react";
import { adminService } from "../services";
import { useData } from "./DataContext";
import store from "../js/store";
import { isUserAdmin, isSuperAdmin } from "../js/utils";
import { resolveCurrentSchoolId } from "../utils/currentSchool";

// Create context for admin status
const AdminStatusContext = createContext();

const getDefaultStatus = () => ({
  isAdmin: false,
  isAdminForSchool: false,
  isAdminForCurrentSchool: false,
  canManageCurrentSchool: false,
  currentSchoolId: resolveCurrentSchoolId(),
  adminStatus: null,
  schoolIds: [],
  loading: true,
  error: null,
});

const buildAdminStatusResult = async (authUser, getAdminByEmail) => {
  const currentSchoolId = resolveCurrentSchoolId();

  if (!authUser) {
    return {
      isAdmin: false,
      isAdminForSchool: false,
      isAdminForCurrentSchool: false,
      canManageCurrentSchool: false,
      currentSchoolId,
      status: null,
      schoolIds: [],
      user: null,
      adminProfile: null,
    };
  }

  const isUserAdminResult = isUserAdmin(authUser);
  const fallbackSchoolIds = Array.isArray(authUser?.schoolIds)
    ? authUser.schoolIds
    : [];

  const result = {
    isAdmin: isUserAdminResult,
    isAdminForSchool: fallbackSchoolIds.length > 0,
    isAdminForCurrentSchool: false,
    canManageCurrentSchool: false,
    currentSchoolId,
    status: authUser?.admin_status || null,
    schoolIds: fallbackSchoolIds,
    user: { email: authUser.email },
    adminProfile: authUser?.adminProfile || null,
  };

  if (!isUserAdminResult) {
    return result;
  }

  try {
    const adminData = await getAdminByEmail(authUser.email);
    if (adminData?.data) {
      const adminProfile = adminData.data;
      result.schoolIds = Array.isArray(adminProfile.school_ids)
        ? adminProfile.school_ids
        : [];
      result.isAdminForSchool = result.schoolIds.length > 0;
      result.status = adminProfile.status || result.status;
      result.adminProfile = adminProfile;
    }
  } catch (adminError) {
    // Preserve coarse admin state if profile lookup fails.
    console.warn(
      "Could not fetch admin profile data, falling back to authUser admin properties:",
      adminError
    );
  }

  const hasCurrentSchoolAccess = currentSchoolId
    ? adminService.isAdminForSchool(currentSchoolId, store)
    : false;
  const isSuperAdminUser = isSuperAdmin(authUser.email);
  const isApprovedAdmin = result.status === "approved";

  result.isAdminForCurrentSchool = !!hasCurrentSchoolAccess;
  result.canManageCurrentSchool =
    !!currentSchoolId && !!hasCurrentSchoolAccess && (isSuperAdminUser || isApprovedAdmin);

  return result;
};

// Provider component for admin status
export const AdminStatusProvider = ({ children }) => {
  const { getAdminByEmail } = useData();

  const [adminStatus, setAdminStatus] = useState(getDefaultStatus);

  // Use ref to persist initialization state across renders
  const isInitializedRef = useRef(false);

  // Initialize admin status only after auth state is settled
  useEffect(() => {
    let checkInterval;
    const maxAttempts = 20; // Maximum number of attempts (20 * 500ms = 10 seconds)
    let attempts = 0;

    const checkAndInitialize = async () => {
      // Prevent additional calls if already initialized
      if (isInitializedRef.current) {
        if (checkInterval) {
          clearInterval(checkInterval);
        }
        return;
      }

      try {
        // Get the current user's auth data from the store
        const authUser = store.state.authUser;

        if (authUser) {
          // Clear the interval if it was set
          if (checkInterval) {
            clearInterval(checkInterval);
          }

          setAdminStatus((prev) => ({ ...prev, loading: true, error: null }));

          const result = await buildAdminStatusResult(authUser, getAdminByEmail);

          setAdminStatus((prevStatus) => {
            // Only update if the status has actually changed to prevent unnecessary re-renders
            const hasStatusChanged =
              prevStatus.isAdmin !== result.isAdmin ||
              prevStatus.isAdminForSchool !== result.isAdminForSchool ||
              prevStatus.isAdminForCurrentSchool !== result.isAdminForCurrentSchool ||
              prevStatus.canManageCurrentSchool !== result.canManageCurrentSchool ||
              prevStatus.currentSchoolId !== result.currentSchoolId ||
              prevStatus.adminStatus !== result.status ||
              JSON.stringify(prevStatus.schoolIds) !==
                JSON.stringify(result.schoolIds || []);

            if (hasStatusChanged) {
              isInitializedRef.current = true;
              return {
                isAdmin: result.isAdmin,
                isAdminForSchool: result.isAdminForSchool,
                isAdminForCurrentSchool: result.isAdminForCurrentSchool,
                canManageCurrentSchool: result.canManageCurrentSchool,
                currentSchoolId: result.currentSchoolId,
                adminStatus: result.status,
                schoolIds: result.schoolIds || [],
                loading: false,
                error: null,
              };
            }
            // Return previous state if nothing changed and mark as initialized
            isInitializedRef.current = true;
            return {
              ...prevStatus,
              loading: false,
              error: null,
            };
          });
        } else {
          // Increment attempts counter
          attempts++;

          // If we've reached max attempts, stop trying and set default values
          if (attempts >= maxAttempts) {
            if (checkInterval) {
              clearInterval(checkInterval);
            }
            setAdminStatus((prev) => {
              if (!prev.loading) return prev; // Only update if still loading
              isInitializedRef.current = true;
              return {
                isAdmin: false,
                isAdminForSchool: false,
                isAdminForCurrentSchool: false,
                canManageCurrentSchool: false,
                currentSchoolId: resolveCurrentSchoolId(),
                adminStatus: null,
                schoolIds: [],
                loading: false,
                error: null,
              };
            });
          }
        }
      } catch (error) {
        if (checkInterval) {
          clearInterval(checkInterval);
        }
        setAdminStatus((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        isInitializedRef.current = true; // Mark as initialized to stop polling after error
      }
    };

    // Check immediately first
    checkAndInitialize();

    // If no user email yet, set up interval to keep checking with longer interval
    if (!store.state.authUser?.email && !isInitializedRef.current) {
      checkInterval = setInterval(checkAndInitialize, 500); // Increased interval to reduce frequency
    }

    // Cleanup interval on unmount
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [getAdminByEmail]);

  // Function to refresh admin status - using ref to prevent stale closure issues
  const refreshAdminStatus = useCallback(async () => {
    try {
      setAdminStatus((prev) => ({ ...prev, loading: true, error: null }));

      const authUser = store.state.authUser;
      if (!authUser) {
        throw new Error("No user available");
      }

      const result = await buildAdminStatusResult(authUser, getAdminByEmail);

      setAdminStatus((prevStatus) => {
        // Only update if the status has actually changed to prevent unnecessary re-renders
        const hasStatusChanged =
          prevStatus.isAdmin !== result.isAdmin ||
          prevStatus.isAdminForSchool !== result.isAdminForSchool ||
          prevStatus.isAdminForCurrentSchool !== result.isAdminForCurrentSchool ||
          prevStatus.canManageCurrentSchool !== result.canManageCurrentSchool ||
          prevStatus.currentSchoolId !== result.currentSchoolId ||
          prevStatus.adminStatus !== result.status ||
          JSON.stringify(prevStatus.schoolIds) !== JSON.stringify(result.schoolIds || []);

        if (hasStatusChanged) {
          isInitializedRef.current = true;
          return {
            isAdmin: result.isAdmin,
            isAdminForSchool: result.isAdminForSchool,
            isAdminForCurrentSchool: result.isAdminForCurrentSchool,
            canManageCurrentSchool: result.canManageCurrentSchool,
            currentSchoolId: result.currentSchoolId,
            adminStatus: result.status,
            schoolIds: result.schoolIds || [],
            loading: false,
            error: null,
          };
        }
        // Return previous state if nothing changed
        return {
          ...prevStatus,
          loading: false,
          error: null,
        };
      });

      return result;
    } catch (error) {
      console.error("Error refreshing admin status:", error);
      setAdminStatus((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  }, [getAdminByEmail]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      ...adminStatus,
      refreshAdminStatus,
    }),
    [adminStatus, refreshAdminStatus]
  );

  return (
    <AdminStatusContext.Provider value={contextValue}>
      {children}
    </AdminStatusContext.Provider>
  );
};

// Hook to use the admin status context
export const useAdminStatus = () => {
  const context = useContext(AdminStatusContext);
  if (!context) {
    throw new Error(
      "useAdminStatus must be used within an AdminStatusProvider"
    );
  }

  return context;
};

export default AdminStatusContext;
