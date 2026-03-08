import { useState, useEffect, createContext, useContext, useCallback, useMemo, useRef } from "react";
import { studentService } from "../services/studentService";
import { studentSchoolService } from "../services/studentSchoolService";
import store from "../js/store";
import { isApprovedAdminUser } from "../js/utils";

// Create context for student status
const StudentStatusContext = createContext();

// Provider component for student status
export const StudentStatusProvider = ({ children }) => {
  const [studentStatus, setStudentStatus] = useState({
    isStudent: false,
    hasStudentData: false,
    studentId: null,
    studentData: null,
    schoolIds: [],
    currentSchoolId: null,
    loading: true,
    error: null,
  });

  // Use ref to persist initialization state across renders
  const isInitializedRef = useRef(false);

  // Initialize student status
  useEffect(() => {
    let checkInterval;
    const maxAttempts = 20; // Maximum number of attempts (20 * 500ms = 10 seconds)
    let attempts = 0;

    const checkAndInitialize = async () => {
      // Prevent additional calls if already initialized
      if (isInitializedRef.current) {
        return;
      }

      try {
        // Check if user is authenticated but not an admin, OR if they're a trial user
        const authUser = store.state.authUser;
        const isAdmin = isApprovedAdminUser(authUser);

        // Also check for trial users who have isTrial flag in localStorage but no authUser
        const hasTrialAccess = localStorage.getItem("isTrial") === "true";
        const hasStudentId = !!localStorage.getItem("studentId");
        const hasInviteAccess = localStorage.getItem("isInvite") === "true";
        const hasAccessToken = localStorage.getItem("isAccessToken") === "true";

        if (
          (authUser?.email && !isAdmin) ||
          hasTrialAccess ||
          hasStudentId ||
          hasInviteAccess ||
          hasAccessToken
        ) {
          // Clear the interval if it was set
          if (checkInterval) {
            clearInterval(checkInterval);
          }

          setStudentStatus((prev) => ({ ...prev, loading: true, error: null }));

          // Determine if user is a student by checking localStorage and database
          const result = await checkStudentStatus();

          setStudentStatus(prevStatus => {
            // Only update if the status has actually changed to prevent unnecessary re-renders
            const hasStatusChanged =
              prevStatus.isStudent !== result.isStudent ||
              prevStatus.hasStudentData !== result.hasStudentData ||
              prevStatus.studentId !== result.studentId ||
              JSON.stringify(prevStatus.schoolIds) !== JSON.stringify(result.schoolIds) ||
              prevStatus.currentSchoolId !== result.currentSchoolId;

            if (hasStatusChanged) {
              isInitializedRef.current = true;
              return {
                isStudent: result.isStudent,
                hasStudentData: result.hasStudentData,
                studentId: result.studentId,
                studentData: result.studentData,
                schoolIds: result.schoolIds,
                currentSchoolId: result.currentSchoolId,
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
        } else {
          // Increment attempts counter
          attempts++;

          // If we've reached max attempts, stop trying and set default values
          if (attempts >= maxAttempts) {
            if (checkInterval) {
              clearInterval(checkInterval);
            }
            setStudentStatus(prev => {
              if (!prev.loading) return prev; // Only update if still loading
              isInitializedRef.current = true;
              return {
                isStudent: false,
                hasStudentData: false,
                studentId: null,
                studentData: null,
                schoolIds: [],
                currentSchoolId: null,
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
        setStudentStatus((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
        isInitializedRef.current = true; // Mark as initialized to stop polling after error
      }
    };

    // Check immediately first
    checkAndInitialize();

    // If no user email yet or user is admin, set up interval to keep checking with longer interval
    // Unless they're a trial user (has isTrial flag but no authUser)
    const authUser = store.state.authUser;
    const isAdmin = isApprovedAdminUser(authUser);
    const hasTrialAccess = localStorage.getItem("isTrial") === "true";
    const hasStudentId = !!localStorage.getItem("studentId");
    const hasInviteAccess = localStorage.getItem("isInvite") === "true";
    const hasAccessToken = localStorage.getItem("isAccessToken") === "true";

    if (
      (!authUser?.email || isAdmin) &&
      !hasTrialAccess &&
      !hasStudentId &&
      !hasInviteAccess &&
      !hasAccessToken &&
      !isInitializedRef.current
    ) {
      checkInterval = setInterval(checkAndInitialize, 500); // Increased interval to reduce frequency
    }

    // Cleanup interval on unmount
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, []); // Empty dependency array to ensure this only runs once

  // Function to check and return current student status
  const checkStudentStatus = useCallback(async () => {
    try {
      // Check if student ID exists in localStorage
      const localStorageStudentId = localStorage.getItem("studentId");
      const selectedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
      let isStudent = false;
      let hasStudentData = false;
      let studentId = null;
      let studentData = null;
      let schoolIds = [];
      let currentSchoolId = selectedSchoolId;

      if (localStorageStudentId) {
        // User has a student ID in localStorage
        isStudent = true;
        studentId = localStorageStudentId;

        // Get student data from localStorage
        const localStorageStudentData = localStorage.getItem("studentData");
        if (localStorageStudentData) {
          try {
            studentData = JSON.parse(localStorageStudentData);
            hasStudentData = true;
          } catch (e) {
            console.warn("Could not parse studentData from localStorage");
          }
        }
      } else {
        // Fallback: resolve student by authenticated email (email-based students)
        const authUser = store.state.authUser;
        if (authUser?.email) {
          try {
            const { data: studentByEmail, error: studentByEmailError } =
              await studentService.findStudentByEmail(authUser.email);

            if (!studentByEmailError && studentByEmail?.id) {
              studentId = studentByEmail.id;
              studentData = studentByEmail;
              hasStudentData = true;
              isStudent = true;

              // Persist for consistency with phone/passcode flow
              localStorage.setItem("studentId", studentByEmail.id);
              localStorage.setItem("studentData", JSON.stringify(studentByEmail));
            }
          } catch (emailError) {
            console.error("Error resolving student by email:", emailError);
          }
        }
      }

      if (studentId) {
        // Get student-school relationships from database
        try {
          const { data: relationships, error } = 
            await studentSchoolService.getRelationshipsByStudentId(studentId);

          if (!error && relationships && Array.isArray(relationships)) {
            // Filter for approved and not archived relationships
            const activeRelationships = relationships.filter(
              (rel) => rel.approved === true && rel.archived === false
            );

            schoolIds = activeRelationships.map(rel => rel.school_id);

            // If current school isn't in the active relationships, set the first one
            if (selectedSchoolId && !schoolIds.includes(selectedSchoolId)) {
              currentSchoolId = schoolIds.length > 0 ? schoolIds[0] : selectedSchoolId;
            }
          }
        } catch (relError) {
          console.error("Error fetching student relationships:", relError);
        }
      }

      return {
        isStudent,
        hasStudentData,
        studentId,
        studentData,
        schoolIds,
        currentSchoolId
      };
    } catch (error) {
      console.error("Error checking student status:", error);
      return {
        isStudent: false,
        hasStudentData: false,
        studentId: null,
        studentData: null,
        schoolIds: [],
        currentSchoolId: null
      };
    }
  }, []);

  // Function to refresh student status - using ref to prevent stale closure issues
  const refreshStudentStatus = useCallback(async () => {
    try {
      setStudentStatus((prev) => ({ ...prev, loading: true, error: null }));

      const result = await checkStudentStatus();

      setStudentStatus(prevStatus => {
        // Only update if the status has actually changed to prevent unnecessary re-renders
        const hasStatusChanged =
          prevStatus.isStudent !== result.isStudent ||
          prevStatus.hasStudentData !== result.hasStudentData ||
          prevStatus.studentId !== result.studentId ||
          JSON.stringify(prevStatus.schoolIds) !== JSON.stringify(result.schoolIds) ||
          prevStatus.currentSchoolId !== result.currentSchoolId;

        if (hasStatusChanged) {
          return {
            isStudent: result.isStudent,
            hasStudentData: result.hasStudentData,
            studentId: result.studentId,
            studentData: result.studentData,
            schoolIds: result.schoolIds,
            currentSchoolId: result.currentSchoolId,
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
      console.error("Error refreshing student status:", error);
      setStudentStatus((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
      throw error;
    }
  }, [checkStudentStatus]);

  // Function to logout student (clear student data)
  const logoutStudent = useCallback(async () => {
    try {
      // Clear all student-related localStorage items
      localStorage.removeItem("studentId");
      localStorage.removeItem("studentData");
      localStorage.removeItem("studentRecord");
      localStorage.removeItem("studentStatus");
      localStorage.removeItem("isTrial");
      localStorage.removeItem("trialExpiresAt");

      setStudentStatus(prev => ({
        ...prev,
        isStudent: false,
        hasStudentData: false,
        studentId: null,
        studentData: null,
        schoolIds: [],
        currentSchoolId: null
      }));

      return true;
    } catch (error) {
      console.error("Error logging out student:", error);
      return false;
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...studentStatus,
    refreshStudentStatus,
    logoutStudent,
  }), [studentStatus, refreshStudentStatus, logoutStudent]);

  return (
    <StudentStatusContext.Provider value={contextValue}>
      {children}
    </StudentStatusContext.Provider>
  );
};

// Hook to use the student status context
export const useStudentStatus = () => {
  const context = useContext(StudentStatusContext);
  if (!context) {
    throw new Error(
      "useStudentStatus must be used within a StudentStatusProvider"
    );
  }

  return context;
};

export default StudentStatusContext;
