// src/services/progressService.js
import { SUPABASE_CONFIG } from "../services/supabase";

// Progress operations using fetch API instead of Supabase client
export const progressService = {
  // Create or update student progress
  upsertProgress: async (progressData) => {
    try {
      // Access environment variables directly through import.meta
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to upsert progress (using POST with Prefer header)
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_student_progress`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation,resolution=merge-duplicates",
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error("Error upserting student progress:", error);
      return { data: null, error };
    }
  },

  // Get student progress by student ID and maquette ID
  getProgress: async (studentId, maquetteId) => {
    try {
      // Access environment variables directly through import.meta
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to get progress for student and maquette
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_progress?student_id=eq.${studentId}&maquette_id=eq.${maquetteId}&select=*`,
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
        // If no rows returned, it's not an error - just return null
        if (response.status === 406 || response.status === 200) {
          const data = await response.json();
          return { data: Array.isArray(data) && data.length > 0 ? data[0] : null, error: null };
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : null, error: null };
    } catch (error) {
      console.error(`Error fetching progress for student ${studentId} and maquette ${maquetteId}:`, error);
      return { data: null, error };
    }
  },

  // Get all progress for a student
  getProgressByStudentId: async (studentId) => {
    try {
      // Access environment variables directly through import.meta
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to get all progress for a student
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_progress?student_id=eq.${studentId}&select=*`,
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
      console.error(`Error fetching progress for student ${studentId}:`, error);
      return { data: null, error };
    }
  },

  // Get all progress for a maquette
  getProgressByMaquetteId: async (maquetteId) => {
    try {
      // Access environment variables directly through import.meta
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to get all progress for a maquette
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_progress?maquette_id=eq.${maquetteId}&select=*`,
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
      console.error(`Error fetching progress for maquette ${maquetteId}:`, error);
      return { data: null, error };
    }
  },

  // Update student progress
  updateProgress: async (id, updates) => {
    try {
      // Access environment variables directly through import.meta
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to update progress
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_student_progress?id=eq.${id}`, {
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
      console.error(`Error updating progress ${id}:`, error);
      return { data: null, error };
    }
  },

  // Delete student progress
  deleteProgress: async (id) => {
    try {
      // Access environment variables directly through import.meta
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      // Make fetch request to Supabase REST API to delete progress
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_student_progress?id=eq.${id}`, {
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
      console.error(`Error deleting progress ${id}:`, error);
      return { error };
    }
  }
}