import { useState, useEffect, createContext, useContext } from "react";
import { maquetteService } from "../services";
import { SUPABASE_CONFIG } from "../services/supabase";

// Create context for maquetteGroups
const MaquetteGroupsContext = createContext();

// Provider component for maquetteGroups
export const MaquetteGroupsProvider = ({ children }) => {
  const [maquetteGroups, setMaquetteGroups] = useState([]);
  const [maquetteGroupRecords, setMaquetteGroupRecords] = useState([]); // Store the raw records with their IDs

  // Initialize maquette groups using the service
  useEffect(() => {
    const loadMaquetteGroups = async () => {
      try {
        // Use the centralized service method to fetch maquette groups
        const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
        const result = await maquetteService.fetchMaquetteGroups(
          currentSchoolId
        );
        setMaquetteGroups(result.groups); // Set the individual groups
        setMaquetteGroupRecords(result.records); // Set the raw records
      } catch (error) {
        console.error("Error loading maquette groups:", error);
        // Set default groups if there's an error
        setMaquetteGroups([]);
        setMaquetteGroupRecords([]);
      }
    };

    loadMaquetteGroups();
  }, []);

  // Effect to watch for changes in localStorage selectedSchoolId
  useEffect(() => {
    const handleStorageChange = () => {
      const newSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
      if (newSchoolId !== process.env.VITE_REACT_APP_DEFAULTSCHOOL) {
        refreshMaquetteGroups();
      }
    };

    // Listen for storage events to detect changes to selectedSchoolId
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Function to refresh maquette groups from the database
  const refreshMaquetteGroups = async () => {
    try {
      // Use the centralized service method to fetch maquette groups
      const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
      const result = await maquetteService.fetchMaquetteGroups(currentSchoolId);
      setMaquetteGroups(result.groups); // Set the individual groups
      setMaquetteGroupRecords(result.records); // Set the raw records
    } catch (error) {
      console.error("Error refreshing maquette groups:", error);
    }
  };

  // Function to update maquette groups in the database and context
  const updateMaquetteGroups = async (updatedData) => {
    try {
      const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;

      // Find the existing record for this school to get the record ID
      const existingRecord = maquetteGroupRecords?.[0]; // Assuming single record per school
      let recordId = existingRecord?.id;
      let existingGroups = existingRecord?.groups || [];

      // If no existing record found, create one
      if (!recordId) {
        const result = await maquetteService.addMaquetteGroup(
          currentSchoolId,
          updatedData.groups[0],
          updatedData.groups,
          null
        );
        if (result.error) {
          throw result.error;
        }
        setMaquetteGroupRecords([result.data]);
        setMaquetteGroups(updatedData.groups);
        return result;
      }

      // Update the existing record with the new groups
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

      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/drv_maquettes_groups?id=eq.${recordId}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            groups: updatedData.groups,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(
          `HTTP error updating! Status: ${updateResponse.status}`
        );
      }

      const updateData = await updateResponse.json();
      const updatedRecord =
        Array.isArray(updateData) && updateData.length > 0
          ? updateData[0]
          : updateData;

      // Update the context with the new data
      setMaquetteGroupRecords([updatedRecord]);
      setMaquetteGroups(updatedData.groups);

      return { data: updatedRecord, error: null };
    } catch (error) {
      console.error("Error updating maquette groups:", error);
      return { data: null, error };
    }
  };

  return (
    <MaquetteGroupsContext.Provider
      value={{
        maquetteGroups,
        setMaquetteGroups,
        maquetteGroupRecords,
        setMaquetteGroupRecords,
        refreshMaquetteGroups,
        updateMaquetteGroups,
      }}
    >
      {children}
    </MaquetteGroupsContext.Provider>
  );
};

// Hook to use the maquetteGroups context
export const useMaquetteGroups = () => {
  const context = useContext(MaquetteGroupsContext);
  if (!context) {
    throw new Error(
      "useMaquetteGroups must be used within a MaquetteGroupsProvider"
    );
  }

  return context;
};

export default MaquetteGroupsContext;