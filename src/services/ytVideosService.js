// src/services/ytVideosService.js
import { SUPABASE_CONFIG } from "./supabase";

// YouTube Video operations using fetch API instead of Supabase client
export const ytVideosService = {
  // Create a new video entry
  createVideoEntry: async (videoData) => {
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

      // Make fetch request to Supabase REST API to create video entry
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_yt_video_entries`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(videoData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error("Error creating video entry:", error);
      return { data: null, error };
    }
  },

  // Get video entries by driving school ID
  getVideoEntriesBySchoolId: async (schoolId) => {
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

      // Make fetch request to Supabase REST API to get video entries by driving school ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_yt_video_entries?driving_school_id=eq.${schoolId}&order=created_at.asc&select=*`,
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
      console.error(`Error fetching video entries for school ${schoolId}:`, error);
      return { data: null, error };
    }
  },

  // Get video entry by ID
  getVideoEntryById: async (id) => {
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

      // Make fetch request to Supabase REST API to get video entry by ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_yt_video_entries?id=eq.${id}&select=*`,
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
      console.error(`Error fetching video entry with id ${id}:`, error);
      return { data: null, error };
    }
  },

  // Update a video entry
  updateVideoEntry: async (id, updates) => {
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

      // Make fetch request to Supabase REST API to update video entry
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_yt_video_entries?id=eq.${id}`, {
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
      console.error(`Error updating video entry ${id}:`, error);
      return { data: null, error };
    }
  },

  // Delete a video entry
  deleteVideoEntry: async (id) => {
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

      // Make fetch request to Supabase REST API to delete video entry
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_yt_video_entries?id=eq.${id}`, {
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
      console.error(`Error deleting video entry ${id}:`, error);
      return { error };
    }
  }
};