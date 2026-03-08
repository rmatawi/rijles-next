// src/services/maquetteService.js
import { SUPABASE_CONFIG } from "../services/supabase";
import { convertTo3x3Grid } from "../js/utils";
import { resolveCurrentSchoolId } from "../utils/currentSchool";

const normalizeEnvValue = (value) =>
  value == null ? "" : String(value).trim().replace(/^["']|["']$/g, "");

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

// Return hardcoded groups when no school ID is provided
const hardcodedGroups = [
  {
    id: "wegsituatie_smal_breed",
    order: "0100",
    title: "Wegsituatie Smal / Breed",
  },
];

// Maquette operations using fetch API instead of Supabase client
export const maquetteService = {
  // Create a new maquette
  createMaquette: async (maquetteData) => {
    try {
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

      // Make fetch request to Supabase REST API to create maquette
      const url = `${supabaseUrl}/rest/v1/drv_maquettes`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(maquetteData),
      });

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error("Error creating maquette:", error);
      return { data: null, error };
    }
  },

  // Get maquette by ID with vehicles
  getMaquetteById: async (id) => {
    try {
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

      // Make fetch request to Supabase REST API to get maquette by ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_maquettes?id=eq.${id}&select=*`,
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

      let data = await response.json();
      
      // If we received a single maquette object, convert it to 3x3 grid format
      if (Array.isArray(data) && data.length > 0) {
        const maquette = data[0];
        if (maquette && maquette.maquette) {
          const convertedMaquette = convertTo3x3Grid(maquette.maquette);
          data[0] = { ...maquette, maquette: convertedMaquette };
        }
      } else if (data && data.maquette) {
        // If we received a single maquette object, convert it
        const convertedMaquette = convertTo3x3Grid(data.maquette);
        data = { ...data, maquette: convertedMaquette };
      }
      
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error(`Error fetching maquette with id ${id}:`, error);
      return { data: null, error };
    }
  },

  // Update a maquette
  updateMaquette: async (id, updates) => {
    try {
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

      // Make fetch request to Supabase REST API to update maquette
      const url = `${supabaseUrl}/rest/v1/drv_maquettes?id=eq.${id}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error(`Error updating maquette ${id}:`, error);
      return { data: null, error };
    }
  },

  // Delete a maquette
  deleteMaquette: async (id) => {
    try {
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

      // Make fetch request to Supabase REST API to delete maquette
      const url = `${supabaseUrl}/rest/v1/drv_maquettes?id=eq.${id}`;
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return { error: null };
    } catch (error) {
      console.error(`Error deleting maquette ${id}:`, error);
      return { error };
    }
  },

  // Get first 5 maquettes from the database
  getFirstFiveMaquettes: async () => {
    try {
      // Get the current school ID
      const schoolId = normalizeEnvValue(resolveCurrentSchoolId());

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

      // Avoid broken PostgREST filters like eq.undefined / eq.null
      if (!schoolId || !isUuid(schoolId)) {
        console.warn(
          "Skipping getFirstFiveMaquettes: invalid school ID:",
          schoolId || "(empty)"
        );
        return { data: [], error: null };
      }

      // Make fetch request to Supabase REST API to get first 5 maquettes filtered by school ID
      const url = `${supabaseUrl}/rest/v1/drv_maquettes?driving_school_id=eq.${encodeURIComponent(
        schoolId
      )}&order=created_at.asc&select=*&limit=5`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `HTTP error! Status: ${response.status}. Response: ${errorBody}`
        );
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      let data = await response.json();

      // Convert each maquette to 3x3 grid format
      if (Array.isArray(data)) {
        data = data.map(maquette => {
          if (maquette && maquette.maquette) {
            const convertedMaquette = convertTo3x3Grid(maquette.maquette);
            return { ...maquette, maquette: convertedMaquette };
          }
          return maquette;
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching first 5 maquettes:', error);
      return { data: null, error };
    }
  },

  // Get maquettes by driving school ID
  getMaquettesBySchoolId: async (schoolId) => {
    try {
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

      // Make fetch request to Supabase REST API to get maquettes by driving school ID
      const url = `${supabaseUrl}/rest/v1/drv_maquettes?driving_school_id=eq.${schoolId}&order=created_at.asc&select=*`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`HTTP error! Status: ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      let data = await response.json();

      // Convert each maquette to 3x3 grid format
      if (Array.isArray(data)) {
        data = data.map(maquette => {
          if (maquette && maquette.maquette) {
            const convertedMaquette = convertTo3x3Grid(maquette.maquette);
            return { ...maquette, maquette: convertedMaquette };
          }
          return maquette;
        });
      }

      return { data, error: null };
    } catch (error) {
      console.error(`Error fetching maquettes for school ${schoolId}:`, error);
      return { data: null, error };
    }
  },

  // Function to fetch maquette groups from Supabase - returns individual groups as received from DB with minimal necessary processing
  fetchMaquetteGroups: async (drivingSchoolId) => {
    let result = {
      groups: hardcodedGroups, // Individual groups for UI components
      records: [], // No raw records for hardcoded data
    };

    // Check if drivingSchoolId is valid before making the API call
    if (
      !drivingSchoolId ||
      drivingSchoolId === "undefined" ||
      drivingSchoolId === undefined
    ) {
      // Return the hardcoded groups and an empty records array
      return result;
    }

    try {
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

      let url;
      // Fetch maquette groups for a specific driving school only
      url = `${supabaseUrl}/rest/v1/drv_maquettes_groups?driving_school_id=eq.${encodeURIComponent(
        drivingSchoolId
      )}&select=*`;

      // Make fetch request to Supabase REST API to get maquette groups
      const response = await fetch(url, {
        method: "GET",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "fetchMaquetteGroups - HTTP error! Status:",
          response.status
        );
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const records = await response.json();

      // Extract the individual groups from the 'groups' field in each record
      // This is necessary for the application to function, but we will not modify the original group properties
      let allGroups = [];

      for (const record of Array.isArray(records) ? records : [records]) {
        if (record.groups && Array.isArray(record.groups)) {
          // Simply extract groups without modification - this is minimal necessary processing
          const extractedGroups = record.groups.map((group) => ({
            ...group, // Copy all original group properties as-is
          }));
          allGroups = allGroups.concat(extractedGroups);
        }
      }

      // Return the extracted groups and raw records
      if (allGroups?.length > 0) {
        result = {
          groups: allGroups, // Individual groups for UI components
          records: Array.isArray(records) ? records : [records], // Raw records for other purposes
        };
      }

      return result;
    } catch (error) {
      console.error("Error fetching maquette groups:", error);
      // Return empty objects in case of error
      return result;
    }
  },

  // Function to add a new maquette group to the database
  addMaquetteGroup: async (
    drivingSchoolId,
    newGroup,
    existingGroups = null,
    recordId = null
  ) => {
    try {
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

      let groups = [];

      // If we have a recordId, we have the existing groups so we can skip fetching
      if (recordId && existingGroups !== null) {
        groups = existingGroups;
      } else if (recordId) {
        // If we have recordId but not the groups, we need to fetch the current groups
        const fetchResponse = await fetch(
          `${supabaseUrl}/rest/v1/drv_maquettes_groups?id=eq.${encodeURIComponent(
            recordId
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

        if (fetchResponse.ok) {
          const records = await fetchResponse.json();
          if (Array.isArray(records) && records.length > 0) {
            const existingRecord = records[0];
            groups = existingRecord.groups || [];
          }
        } else {
          throw new Error(
            `HTTP error fetching existing record! Status: ${fetchResponse.status}`
          );
        }
      } else if (existingGroups !== null) {
        // If existing groups are provided but no recordId, we need to fetch the record to get the ID
        const fetchResponse = await fetch(
          `${supabaseUrl}/rest/v1/drv_maquettes_groups?driving_school_id=eq.${encodeURIComponent(
            drivingSchoolId
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

        if (fetchResponse.ok) {
          const records = await fetchResponse.json();
          if (Array.isArray(records) && records.length > 0) {
            // Use the existing record
            const existingRecord = records[0];
            recordId = existingRecord.id;
            groups = existingRecord.groups || [];
          }
        } else if (fetchResponse.status === 406) {
          // No existing record, we'll create one later
          groups = existingGroups;
        }
      } else {
        // Fetch the existing maquette groups record for this driving school
        const fetchResponse = await fetch(
          `${supabaseUrl}/rest/v1/drv_maquettes_groups?driving_school_id=eq.${encodeURIComponent(
            drivingSchoolId
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

        if (!fetchResponse.ok) {
          // If no records exist, we'll create a new one
          if (fetchResponse.status === 406) {
            // Not found
            // Create a new record with the new group
            const createResponse = await fetch(
              `${supabaseUrl}/rest/v1/drv_maquettes_groups`,
              {
                method: "POST",
                headers: {
                  apikey: supabaseAnonKey,
                  Authorization: `Bearer ${supabaseAnonKey}`,
                  "Content-Type": "application/json",
                  Prefer: "return=representation",
                },
                body: JSON.stringify({
                  driving_school_id: drivingSchoolId,
                  groups: [newGroup],
                }),
              }
            );

            if (!createResponse.ok) {
              throw new Error(
                `HTTP error creating record! Status: ${createResponse.status}`
              );
            }

            const createData = await createResponse.json();
            return {
              data:
                Array.isArray(createData) && createData.length > 0
                  ? createData[0]
                  : createData,
              error: null,
            };
          } else {
            throw new Error(
              `HTTP error fetching! Status: ${fetchResponse.status}`
            );
          }
        }

        const records = await fetchResponse.json();

        if (!Array.isArray(records) || records.length === 0) {
          // No existing record, create a new one with the new group
          const createResponse = await fetch(
            `${supabaseUrl}/rest/v1/drv_maquettes_groups`,
            {
              method: "POST",
              headers: {
                apikey: supabaseAnonKey,
                Authorization: `Bearer ${supabaseAnonKey}`,
                "Content-Type": "application/json",
                Prefer: "return=representation",
              },
              body: JSON.stringify({
                driving_school_id: drivingSchoolId,
                groups: [newGroup],
              }),
            }
          );

          if (!createResponse.ok) {
            throw new Error(
              `HTTP error creating record! Status: ${createResponse.status}`
            );
          }

          const createData = await createResponse.json();
          return {
            data:
              Array.isArray(createData) && createData.length > 0
                ? createData[0]
                : createData,
            error: null,
          };
        }

        // We have existing records, get the first one
        const existingRecord = records[0];
        recordId = existingRecord.id;
        groups = existingRecord.groups || [];
      }

      // Check if the new group already exists (by comparing IDs)
      const existingGroupIds = new Set(groups.map((group) => group.id));
      if (existingGroupIds.has(newGroup.id)) {
        // If recordId is available and we already have groups, we can return a representation without fetching
        if (recordId) {
          return {
            data: {
              id: recordId,
              driving_school_id: drivingSchoolId,
              groups: groups,
            },
            error: new Error(`Group with id ${newGroup.id} already exists`),
          };
        } else {
          // If no recordId, we need to return the error only
          return {
            data: null,
            error: new Error(`Group with id ${newGroup.id} already exists`),
          };
        }
      }

      // Add the new group to the existing groups array
      const updatedGroups = [...groups, newGroup];

      // If we found an existing record, update it with the new groups array
      if (recordId) {
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
              groups: updatedGroups,
            }),
          }
        );

        if (!updateResponse.ok) {
          throw new Error(
            `HTTP error updating! Status: ${updateResponse.status}`
          );
        }

        const updateData = await updateResponse.json();
        return {
          data:
            Array.isArray(updateData) && updateData.length > 0
              ? updateData[0]
              : updateData,
          error: null,
        };
      } else {
        // No existing record found, create a new one
        const createResponse = await fetch(
          `${supabaseUrl}/rest/v1/drv_maquettes_groups`,
          {
            method: "POST",
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
              "Content-Type": "application/json",
              Prefer: "return=representation",
            },
            body: JSON.stringify({
              driving_school_id: drivingSchoolId,
              groups: updatedGroups,
            }),
          }
        );

        if (!createResponse.ok) {
          throw new Error(
            `HTTP error creating record! Status: ${createResponse.status}`
          );
        }

        const createData = await createResponse.json();
        return {
          data:
            Array.isArray(createData) && createData.length > 0
              ? createData[0]
              : createData,
          error: null,
        };
      }
    } catch (error) {
      console.error("Error adding maquette group:", error);
      console.error("Error stack:", error.stack);
      return { data: null, error };
    }
  },
};
