import { useState, useEffect, createContext, useContext, useMemo } from "react";
import { useAdminStatus } from "./AdminStatusContext";

// Create context for demo status
const DemoStatusContext = createContext();

// Provider component for demo status
export const DemoStatusProvider = ({ children }) => {
  const [demoStatus, setDemoStatus] = useState({
    isDemo: false,
    loading: true,
  });

  const { isAdmin: isAdminStatus } = useAdminStatus();

  // Update isDemo when user state changes
  useEffect(() => {
    const selectedSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
    const studentId = localStorage.getItem("studentId");
    const freeSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

    const isDemoStatus = selectedSchoolId !== freeSchoolId && !studentId && !isAdminStatus;

    setDemoStatus({
      isDemo: isDemoStatus,
      loading: false,
    });
  }, [isAdminStatus]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...demoStatus,
  }), [demoStatus]);

  return (
    <DemoStatusContext.Provider value={contextValue}>
      {children}
    </DemoStatusContext.Provider>
  );
};

// Hook to use the demo status context
export const useDemoStatus = () => {
  const context = useContext(DemoStatusContext);
  if (!context) {
    throw new Error(
      "useDemoStatus must be used within a DemoStatusProvider"
    );
  }

  return context;
};

export default DemoStatusContext;