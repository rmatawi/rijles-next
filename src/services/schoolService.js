// src/services/schoolService.js
import { SUPABASE_CONFIG } from "../services/supabase";
import store from "../js/store";
import { buildAbsolutePageUrl } from "../utils/appUrl";
import { openExternalUrl } from "../utils/externalLinks";

// Cache to prevent duplicate API calls for the same school ID
const schoolCache = new Map();

// Cache for all schools list to prevent duplicate API calls
let allSchoolsCache = null;
let allSchoolsCacheTimestamp = null;
const ALL_SCHOOLS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// School operations using fetch API instead of Supabase client
export const schoolService = {
  // Create a new driving school for an admin
  createSchool: async (schoolData) => {
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

      // Make fetch request to Supabase REST API to create school
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_schools`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(schoolData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const createdSchool =
        Array.isArray(data) && data.length > 0 ? data[0] : data;

      // Update authUser's schoolIds with the new school ID
      if (store.state.authUser && createdSchool && createdSchool.id) {
        // Get existing school IDs or initialize as empty array
        const existingSchoolIds = Array.isArray(store.state.authUser.schoolIds)
          ? [...store.state.authUser.schoolIds]
          : [];

        // Add the new school ID if it's not already in the array
        if (!existingSchoolIds.includes(createdSchool.id)) {
          const updatedSchoolIds = [...existingSchoolIds, createdSchool.id];

          // Update the authUser's schoolIds directly, following the pattern used in store actions
          store.state.authUser.schoolIds = updatedSchoolIds;
        }
      }

      // Store the created school data in f7 store and cache
      if (createdSchool && createdSchool.id) {
        // Update the cache with fresh data
        schoolCache.set(createdSchool.id, createdSchool);

        // Clear the all schools cache since we have new data
        schoolService.clearAllSchoolsCache();

        // Update the f7 store
        store.dispatch("updateSchoolData", createdSchool);
      }

      return {
        data: createdSchool,
        error: null,
      };
    } catch (error) {
      console.error("Error creating school:", error);
      return { data: null, error };
    }
  },

  // Create a new driving school and update the admin's record to include it
  createSchoolForAdmin: async (schoolData, adminEmail) => {
    try {
      // First, create the school
      const { data: createdSchool, error: createError } =
        await schoolService.createSchool(schoolData);

      if (createError) {
        throw new Error(createError.message);
      }

      if (!createdSchool || !createdSchool.id) {
        throw new Error("School was not created successfully");
      }

      // If admin email is provided, update the admin's school_ids array
      if (adminEmail) {
        try {
          // Import adminService to update admin record
          const adminServiceModule = await import("./adminService");
          const { adminService } = adminServiceModule;

          // Get the current admin record
          const { data: adminData, error: adminError } =
            await adminService.getAdminByEmail(adminEmail);

          if (!adminError && adminData) {
            // Get existing school IDs and add the new one
            const existingSchoolIds = Array.isArray(adminData.school_ids)
              ? [...adminData.school_ids]
              : [];
            if (!existingSchoolIds.includes(createdSchool.id)) {
              existingSchoolIds.push(createdSchool.id);

              // Update the admin record with the new school IDs array
              const { error: updateError } = await adminService.updateAdmin(
                adminData.id,
                {
                  school_ids: existingSchoolIds,
                }
              );

              if (updateError) {
                console.error(
                  "Error updating admin's school_ids:",
                  updateError
                );
                // Don't throw an error here - just log it, as the school was created successfully
                console.warn(
                  `Warning: School created successfully but admin record not updated: ${updateError.message}`
                );
              }
            }
          } else {
            console.error(
              "Error getting admin data to update school_ids:",
              adminError
            );
          }
        } catch (adminServiceError) {
          console.error(
            "Error importing or using adminService:",
            adminServiceError
          );
          // Don't throw an error - the school was created successfully, just warn about admin update
          console.warn(
            "Warning: School created successfully but could not update admin record due to service import error"
          );
        }
      }

      return {
        data: createdSchool,
        error: null,
      };
    } catch (error) {
      console.error("Error creating school for admin:", error);
      return { data: null, error };
    }
  },

  // Get all driving schools
  getSchools: async () => {
    try {
      // Check if we have cached data that's still fresh
      const now = Date.now();
      if (
        allSchoolsCache &&
        allSchoolsCacheTimestamp &&
        now - allSchoolsCacheTimestamp < ALL_SCHOOLS_CACHE_DURATION
      ) {
        return { data: allSchoolsCache, error: null };
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

      // Make fetch request to Supabase REST API to get all schools
      // Include the new fields in the select query
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_schools?select=id,name,description,logo_url,cover_image_url,admin_id,created_at,updated_at,address,area,district,details&order=created_at.desc`,
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

      // Update cache with fresh data
      if (data) {
        allSchoolsCache = data;
        allSchoolsCacheTimestamp = now;

        // Store in localStorage for persistence
        localStorage.setItem("allSchoolsData", JSON.stringify(data));
        // Update the f7 store
        store.dispatch("updateSchoolsList", data);
      }
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching driving schools:", error);
      return { data: null, error };
    }
  },

  // Store the school data in cache and update store if it's the currently selected school
  updateSchoolCacheAndStore: (school) => {
    if (school && school.id) {
      // Update the cache with fresh data
      schoolCache.set(school.id, school);

      // Store in localStorage for persistence
      // localStorage.setItem(`schoolData_${school.id}`, JSON.stringify(school));
      // Only update the f7 store if this is the currently selected school
      // This prevents other schools' data from changing the active school
      const currentSchoolId = process.env.VITE_REACT_APP_DEFAULTSCHOOL;
      if (currentSchoolId === school.id) {
        // Update the f7 store with current school data
        store.dispatch("updateSchoolData", school);
      }
    }
  },

  // Get driving school by ID - this function now handles both ID and name intelligently
  getSchoolById: async (id) => {
    // Basic validation: ensure we have a string input
    if (typeof id !== "string" || !id) {
      return {
        data: null,
        error: new Error("Invalid school identifier provided"),
      };
    }

    // Check if it looks like a name (contains spaces, letters, etc.) rather than a UUID
    // A UUID should look like: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id
      );

    if (!isUUID) {
      // This might be a school name instead of an ID, so try to get by name first
      // This maintains backward compatibility with existing code that passes names to getSchoolById
      const result = await schoolService.getSchoolByName(id);
      // If a school was found by name, we should still cache and update store internally
      // since the caller expects the same behavior regardless of whether it's an ID or name
      if (result.data && result.data.id) {
        schoolService.updateSchoolCacheAndStore(result.data);
      }
      return result;
    }

    // It's a valid UUID, proceed with ID-based lookup
    // Check if school data is already in cache
    if (schoolCache.has(id)) {
      const cachedData = schoolCache.get(id);
      return {
        data: cachedData,
        error: null,
      };
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

      // Make fetch request to Supabase REST API to get school by ID
      // Include the new fields in the select query
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_schools?id=eq.${id}&select=id,name,description,logo_url,cover_image_url,admin_id,created_at,updated_at,address,area,district,details`,
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
      const school = Array.isArray(data) && data.length > 0 ? data[0] : data;

      return {
        data: school,
        error: null,
      };
    } catch (error) {
      console.error(`Error fetching driving school with id ${id}:`, error);
      // Remove from cache if there was an error (so it can be retried)
      schoolCache.delete(id);
      return { data: null, error };
    }
  },

  // Unified function that can get school by either ID or name intelligently
  getSchoolByIdOrName: async (identifier) => {
    if (typeof identifier !== "string" || !identifier) {
      return {
        data: null,
        error: new Error("Invalid school identifier provided"),
      };
    }

    // Check if it looks like a UUID
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier
      );

    if (isUUID) {
      // It's a UUID, use getSchoolById
      return await schoolService.getSchoolById(identifier);
    } else {
      // It's probably a name, use getSchoolByName
      return await schoolService.getSchoolByName(identifier);
    }
  },

  // Get schools by their IDs (array of school IDs assigned to an admin)
  getSchoolsByIds: async (schoolIds) => {
    if (!schoolIds || schoolIds.length === 0) {
      return { data: [], error: null };
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

      // Create the filter for multiple school IDs using 'in' operator
      const schoolIdsFilter = `id=in.(${schoolIds.join(",")})`;

      // Make fetch request to Supabase REST API to get schools by their IDs
      // Include the new fields in the select query
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_schools?${schoolIdsFilter}&select=id,name,description,logo_url,cover_image_url,admin_id,created_at,updated_at,address,area,district,details&order=created_at.desc`,
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
      // Store the data in f7 store
      // Use the store to update school information
      if (data) {
        // Store in localStorage for persistence
        localStorage.setItem("schoolsByIdsData", JSON.stringify(data));
        // Update the f7 store
        store.dispatch("updateSchoolsList", data);
      }
      return { data, error: null };
    } catch (error) {
      console.error(
        `Error fetching schools for school IDs [${schoolIds.join(",")}]:`,
        error
      );
      return { data: null, error };
    }
  },

  // Update a driving school
  updateSchool: async (id, updates) => {
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

      // Make fetch request to Supabase REST API to update school
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_schools?id=eq.${id}&select=id,name,description,logo_url,cover_image_url,admin_id,created_at,updated_at,address,area,district,details`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const updatedSchool =
        Array.isArray(data) && data.length > 0 ? data[0] : data;

      // Store the updated school data in f7 store
      if (updatedSchool && updatedSchool.id) {
        // Update the cache with fresh data
        schoolCache.set(updatedSchool.id, updatedSchool);

        // Clear the all schools cache since we have updated data
        schoolService.clearAllSchoolsCache();

        store.dispatch("updateSchoolData", updatedSchool);
      }

      return {
        data: updatedSchool,
        error: null,
      };
    } catch (error) {
      console.error(`Error updating school ${id}:`, error);
      return { data: null, error };
    }
  },

  // Get schools by admin ID (where the school's admin_id matches the admin's ID)
  getSchoolsByAdminId: async (adminId) => {
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

      // Make fetch request to Supabase REST API to get schools by admin ID
      // Include the new fields in the select query
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_schools?admin_id=eq.${adminId}&select=id,name,description,logo_url,cover_image_url,admin_id,created_at,updated_at,address,area,district,details&order=created_at.desc`,
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
      // Store the data in f7 store
      // Use the store to update school information
      if (data) {
        // Store in localStorage for persistence
        localStorage.setItem("schoolsByAdminData", JSON.stringify(data));
        // Update the f7 store
        store.dispatch("updateSchoolsList", data);
      }
      return { data, error: null };
    } catch (error) {
      console.error(`Error fetching schools for admin ${adminId}:`, error);
      return { data: null, error };
    }
  },

  // Get school by name
  getSchoolByName: async (name) => {
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

      // Make fetch request to Supabase REST API to get school by name
      // Include the new fields in the select query
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_schools?name=eq.${encodeURIComponent(
          name
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

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const school = Array.isArray(data) && data.length > 0 ? data[0] : null;
      console.log({ "schoolData-B01": data });

      return { data: school, error: null };
    } catch (error) {
      console.error(`Error fetching school with name ${name}:`, error);
      return { data: null, error };
    }
  },

  // Delete a driving school
  deleteSchool: async (id) => {
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

      // Make fetch request to Supabase REST API to delete school
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_schools?id=eq.${id}&select=id,name,description,logo_url,cover_image_url,admin_id,created_at,updated_at,address,area,district,details`,
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

      const data = await response.json();
      const deletedSchool =
        Array.isArray(data) && data.length > 0 ? data[0] : null;

      // Remove the deleted school ID from authUser's schoolIds
      if (store.state.authUser && id) {
        const existingSchoolIds = Array.isArray(store.state.authUser.schoolIds)
          ? [...store.state.authUser.schoolIds]
          : [];

        // Filter out the deleted school ID
        const updatedSchoolIds = existingSchoolIds.filter(
          (schoolId) => schoolId !== id
        );

        if (updatedSchoolIds.length !== existingSchoolIds.length) {
          // Only update if the school ID was actually removed
          // Update the authUser's schoolIds directly, following the pattern used in store actions
          store.state.authUser.schoolIds = updatedSchoolIds;
        }
      }

      // Clear the all schools cache since we have deleted data
      schoolService.clearAllSchoolsCache();

      // Remove the school data from f7 store
      // Update the f7 store to remove the deleted school
      store.dispatch("updateSchoolData", null);

      return { error: null };
    } catch (error) {
      console.error(`Error deleting school ${id}:`, error);
      return { error };
    }
  },

  // Update cache with fresh data
  updateSchoolCache: (id, schoolData) => {
    if (id && schoolData) {
      schoolCache.set(id, schoolData);
    }
  },

  // Remove school from cache
  removeSchoolFromCache: (id) => {
    if (id) {
      schoolCache.delete(id);
    }
  },

  // Clear entire school cache
  clearSchoolCache: () => {
    schoolCache.clear();
  },

  // Clear all schools cache
  clearAllSchoolsCache: () => {
    allSchoolsCache = null;
    allSchoolsCacheTimestamp = null;
  },

  // Handle creating or updating a school based on whether it has an ID
  // This function handles both the UI state updates and the API calls
  handleCreateOrUpdateSchool: async (
    editingSchool,
    f7,
    setEditingSchool,
    setDrivingSchool,
    setAssignedSchools,
    authUser
  ) => {
    try {
      // Validate required fields
      if (!editingSchool.name.trim()) {
        f7.toast.show({
          text: "School naam is vereist.",
          position: "center",
        });
        return;
      }

      if (editingSchool.id) {
        // Update existing school
        const schoolData = {
          name: editingSchool.name.trim(),
          description: editingSchool.description,
          logo_url: editingSchool.logo_url,
          cover_image_url: editingSchool.cover_image_url,
          address: editingSchool.address,
          area: editingSchool.area,
          district: editingSchool.district,
        };

        const { data, error } = await schoolService.updateSchool(
          editingSchool.id,
          schoolData
        );

        if (error) {
          throw new Error(error.message || "Error updating school");
        }

        if (data) {
          // Update the driving school state
          setDrivingSchool((prev) => ({
            ...prev,
            name: data.name || prev.name,
            logo: data.logo_url || prev.logo,
            coverPhoto: data.cover_image_url || prev.coverPhoto,
            description: data.description || prev.description,
            address: data.address || prev.address,
            area: data.area || prev.area,
            district: data.district || prev.district,
          }));

          // Update assigned schools state to include updated data
          setAssignedSchools((prev) =>
            prev.map((school) => (school.id === data.id ? data : school))
          );

          // Update school cache and store
          schoolService.updateSchoolCacheAndStore(data);

          // Show success message
          f7.toast.show({
            text: "School succesvol bijgewerkt!",
            position: "center",
          });

          // Close the sheet
          f7.sheet.close("#editschool-sheet");

          // Reset the editing school form
          setEditingSchool({
            id: null,
            name: "",
            description: "",
            logo_url: "",
            cover_image_url: "",
            address: "",
            area: "",
            district: "",
          });

          // No longer adding school param individually as it's handled by env
          const currentUrl = new URL(window.location);
          // currentUrl.searchParams.set("school", data.id); // Removed logic
          window.history.replaceState({}, "", currentUrl.toString());
        }
      } else {
        // Create new school and update admin record in one call
        const schoolData = {
          name: editingSchool.name.trim(),
          description: editingSchool.description,
          logo_url: editingSchool.logo_url,
          cover_image_url: editingSchool.cover_image_url,
          address: editingSchool.address,
          area: editingSchool.area,
          district: editingSchool.district,
          admin_id: authUser?.email || null, // Now properly uses the authUser parameter
        };

        // Use the centralized function that creates the school and updates the admin record
        const { data, error } = await schoolService.createSchoolForAdmin(
          schoolData,
          authUser?.email // Pass the email directly
        );

        if (error) {
          throw new Error(error.message || "Error creating school");
        }

        if (data) {
          f7.dialog.alert(
            "Rijschool succesvol aangemaakt. U wordt nu doorgestuurd naar uw nieuwe rijschoolpagina.",
            "Succes!",
            () => {
              const domain = window.location.origin;
              window.location.href = domain;
            }
          );
        }
      }
    } catch (error) {
      console.error("Error creating/updating school:", error);
      // f7.toast.show({ text: "Fout bij opslaan van school: " + error.message, position: "center",});
    }
  },

  // Function to request access to a specific school
  requestSchoolAccess: async (school, f7) => {
    try {
      if (!school) {
        f7.toast.show({
          text: "Geen school geselecteerd om toegang tot te vragen.",
          position: "center",
        });
        return;
      }

      // Create dialog to collect user information
      const dialogHtml = `
        <div style="padding: 10px 0;">
          <div class="item-input" style="margin-bottom: 15px;">
            <input type="text" id="firstName" placeholder="Voornaam" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
          </div>
          <div class="item-input" style="margin-bottom: 15px;">
            <input type="text" id="lastName" placeholder="Achternaam" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
          </div>
          <div class="item-input">
            <input type="tel" id="phone" placeholder="Telefoonnummer" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
          </div>
        </div>
      `;

      f7.dialog
        .create({
          title: `Toegang Vragen tot ${school.name}`,
          content: dialogHtml,
          buttons: [
            {
              text: "Cancel",
              color: "light",
            },
            {
              text: "Verzenden",
              color: "blue",
              onClick: async () => {
                const firstName = document.getElementById("firstName").value;
                const lastName = document.getElementById("lastName").value;
                const phone = document.getElementById("phone").value;

                if (
                  firstName &&
                  firstName.trim() !== "" &&
                  lastName &&
                  lastName.trim() !== "" &&
                  phone &&
                  phone.trim() !== ""
                ) {
                  try {
                    const requestUrl = buildAbsolutePageUrl(
                      "school-access-request",
                      { firstName, lastName, phone },
                      domain
                    );
                    const messageText = `Nieuw toegangsverzoek van ${firstName} ${lastName}, telefoon ${phone} voor school ${school.name}: ${requestUrl}`;
                    const { resolveRelatedAdminPhone, normalizePhoneForWhatsApp } =
                      await import("./adminContactService");
                    const { phone: resolvedPhone } = await resolveRelatedAdminPhone({
                      schoolId: school.id,
                      studentId: localStorage.getItem("studentId"),
                    });
                    const adminPhone = normalizePhoneForWhatsApp(resolvedPhone);

                    if (!adminPhone) {
                      throw new Error("Geen telefoonnummer gevonden voor de beheerder");
                    }

                    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(
                      messageText
                    )}`;
                    openExternalUrl(whatsappUrl);
                    f7.toast.show({
                      text: "WhatsApp geopend met schoolbeheerder",
                      position: "center",
                    });
                  } catch (error) {
                    console.error(
                      "Fout bij aanmaken van WhatsApp verzoek:",
                      error
                    );
                    f7.dialog.alert(
                      "Fout bij aanmaken van WhatsApp verzoek: " + error.message
                    );
                  }
                } else {
                  f7.dialog.alert(
                    "Voornaam, achternaam en telefoonnummer zijn vereist om verder te gaan."
                  );
                }
              },
            },
          ],
        })
        .open();
    } catch (error) {
      console.error("Error requesting school access:", error);
      f7.toast.show({
        text: "Fout bij het aanvragen van toegang: " + error.message,
        position: "center",
      });
    }
  },
};
