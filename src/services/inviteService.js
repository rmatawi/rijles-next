// src/services/inviteService.js
import { SUPABASE_CONFIG } from "../services/supabase";

// Invite operations using fetch API instead of Supabase client
export const inviteService = {
  // Create a new invite link
  createInvite: async (inviteData) => {
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

      // Make fetch request to Supabase REST API to create invite link
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_invite_links`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error("Error creating invite link:", error);
      return { data: null, error };
    }
  },

  // Get invite by token
  getInviteByToken: async (token) => {
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

      // Make fetch request to Supabase REST API to get invite by token
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_invite_links?token=eq.${token}&select=*`,
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
      const invite = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return { data: invite, error: null };
    } catch (error) {
      console.error(`Error fetching invite with token ${token}:`, error);
      return { data: null, error };
    }
  },

  // Get all invites
  getAllInvites: async () => {
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

      // Make fetch request to Supabase REST API to get all invites
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_invite_links?select=*`,
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
      console.error("Error fetching invites:", error);
      return { data: null, error };
    }
  },

  // Get all invites by school ID
  getInvitesBySchoolId: async (schoolId) => {
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

      // Make fetch request to Supabase REST API to get invites by school ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_invite_links?school_id=eq.${schoolId}&select=*`,
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
      console.error(`Error fetching invites for school ${schoolId}:`, error);
      return { data: null, error };
    }
  },

  // Update an invite
  updateInvite: async (token, updates) => {
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

      // Make fetch request to Supabase REST API to update invite
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_invite_links?token=eq.${token}`, {
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
      console.error(`Error updating invite with token ${token}:`, error);
      return { data: null, error };
    }
  },

  // Delete an invite
  deleteInvite: async (token) => {
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

      // Make fetch request to Supabase REST API to delete invite
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_invite_links?token=eq.${token}`, {
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
      console.error(`Error deleting invite with token ${token}:`, error);
      return { error };
    }
  }
};