// src/services/authService.js

import { supabase, SUPABASE_CONFIG } from "./supabase"

// Authentication operations
export const authService = {
  // Sign up a new user
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      console.error('Error signing up:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  },

  // Sign in an existing user with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Error signing in:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  },

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    
    if (error) {
      console.error('Error signing in with Google:', error)
      return { data: null, error }
    }
    
    return { data, error: null }
  },

  // Sign out the current user
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Error signing out:', error)
      return { error }
    }
    
    return { error: null }
  },

  // Get the current user session
  getCurrentUser: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting current user:', error)
      return { user: null, error }
    }
    
    return { user: session?.user || null, error: null }
  },

  // Get the current user profile (from drv_admins table)
  getUserProfile: async (userEmail) => {
    // Import isSuperAdmin for checking super admin status
    const { isSuperAdmin } = await import('../js/utils');

    // Special case: Super admin is always an admin
    if (isSuperAdmin(userEmail)) {
      return { 
        data: { 
          id: 'rianmatawi-default-admin', 
          email: userEmail, 
          name: 'Rian Matawi (Default Admin)',
          // Add other default admin properties as needed
        }, 
        error: null 
      };
    }
    
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

      // Make fetch request to Supabase REST API to get user profile
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?email=eq.${encodeURIComponent(userEmail)}&select=*`,
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
      console.error('Error getting user profile:', error);
      return { data: null, error };
    }
  },

  // Listen for auth state changes
  onAuthStateChange: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
    return subscription
  }
}