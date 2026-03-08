// src/services/paymentService.js
import { SUPABASE_CONFIG } from "../services/supabase";

// Payment operations using fetch API
export const paymentService = {
  // Create a new payment record
  createPayment: async (paymentData) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/drv_payments`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error("Error creating payment:", error);
      return { data: null, error };
    }
  },

  // Get all payments for a student
  getPaymentsByStudent: async (studentId) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_payments?student_id=eq.${studentId}&select=*,drv_schools(name)&order=payment_date.desc`,
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
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error getting payments by student:", error);
      return { data: [], error };
    }
  },

  // Get all payments for a school
  getPaymentsBySchool: async (schoolId) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_payments?school_id=eq.${schoolId}&select=*,drv_students(name,email,phone)&order=payment_date.desc`,
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
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error getting payments by school:", error);
      return { data: [], error };
    }
  },

  // Get all payments for a student at a specific school
  getPaymentsByStudentAndSchool: async (studentId, schoolId) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_payments?student_id=eq.${studentId}&school_id=eq.${schoolId}&select=*&order=payment_date.desc`,
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
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error getting payments by student and school:", error);
      return { data: [], error };
    }
  },

  // Update a payment record
  updatePayment: async (id, updates) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/drv_payments?id=eq.${id}`, {
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
      console.error("Error updating payment:", error);
      return { data: null, error };
    }
  },

  // Delete a payment record
  deletePayment: async (id) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/drv_payments?id=eq.${id}`, {
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

      // Handle empty response for DELETE
      const contentType = response.headers.get("content-type");
      let data = null;

      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error deleting payment:", error);
      return { data: null, error };
    }
  },
};
