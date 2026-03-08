import { SUPABASE_CONFIG } from "./supabase";

// YouTube Video Categories operations using fetch API instead of Supabase client
export const ytVideoCategoriesService = {
  // Create a new video category
  createCategory: async (categoryData) => {
    try {
      // Access environment variables directly through SUPABASE_CONFIG
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to create video category
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_yt_video_categories`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error("Error creating video category:", error);
      return { data: null, error };
    }
  },

  // Get video categories by driving school ID
  getCategoriesBySchoolId: async (schoolId) => {
    try {
      // Access environment variables directly through SUPABASE_CONFIG
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to get video categories by driving school ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_yt_video_categories?driving_school_id=eq.${schoolId}&order=order_index.asc&select=*`,
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
      console.error(`Error fetching video categories for school ${schoolId}:`, error);
      return { data: null, error };
    }
  },

  // Get video category by ID
  getCategoryById: async (id) => {
    try {
      // Access environment variables directly through SUPABASE_CONFIG
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to get video category by ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_yt_video_categories?id=eq.${id}&select=*`,
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
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error(`Error fetching video category with id ${id}:`, error);
      return { data: null, error };
    }
  },

  // Update a video category
  updateCategory: async (id, updates) => {
    try {
      // Access environment variables directly through SUPABASE_CONFIG
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to update video category
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_yt_video_categories?id=eq.${id}`, {
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
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error(`Error updating video category ${id}:`, error);
      return { data: null, error };
    }
  },

  // Delete a video category
  deleteCategory: async (id) => {
    try {
      // Access environment variables directly through SUPABASE_CONFIG
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to delete video category
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_yt_video_categories?id=eq.${id}`, {
        method: "DELETE",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return { error: null };
    } catch (error) {
      console.error(`Error deleting video category ${id}:`, error);
      return { error };
    }
  },

  // Delete video categories by driving school ID
  deleteCategoriesBySchoolId: async (drivingSchoolId) => {
    try {
      // Access environment variables directly through SUPABASE_CONFIG
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to delete video categories by driving school ID
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_yt_video_categories?driving_school_id=eq.${drivingSchoolId}`, {
        method: "DELETE",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return { error: null };
    } catch (error) {
      console.error(`Error deleting video categories for school ${drivingSchoolId}:`, error);
      return { error };
    }
  }
};