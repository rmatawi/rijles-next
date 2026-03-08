// src/services/studentSchoolService.js
import { SUPABASE_CONFIG } from "../services/supabase";

// Student-School relationship operations using fetch API instead of Supabase client
export const studentSchoolService = {
  // Create a new student-school relationship
  createStudentSchoolRelationship: async (relationshipData) => {
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

      const payload = { ...relationshipData };
      // Keep backward compatibility: if caller still writes granted_by_admin_id,
      // mirror it into instructor_id when not provided.
      if (!payload.instructor_id && payload.granted_by_admin_id) {
        payload.instructor_id = payload.granted_by_admin_id;
      }

      // Make fetch request to Supabase REST API to create student-school relationship
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_student_schools`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}${errorText ? ` - ${errorText}` : ""}`
        );
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error("Error creating student-school relationship:", error);
      return { data: null, error };
    }
  },

  // Get student-school relationship by student ID and school ID
  getRelationshipByStudentAndSchool: async (studentId, schoolId) => {
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

      // Make fetch request to Supabase REST API to get student-school relationship
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_schools?student_id=eq.${studentId}&school_id=eq.${schoolId}&select=*`,
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
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}${errorText ? ` - ${errorText}` : ""}`
        );
      }

      const data = await response.json();
      const relationship = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return { data: relationship, error: null };
    } catch (error) {
      console.error(`Error fetching student-school relationship for student ${studentId} and school ${schoolId}:`, error);
      return { data: null, error };
    }
  },

  // Get all relationships for a specific student
  getRelationshipsByStudentId: async (studentId) => {
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

      // Make fetch request to Supabase REST API to get relationships by student ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_schools?student_id=eq.${studentId}&select=*`,
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
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}${errorText ? ` - ${errorText}` : ""}`
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error(`Error fetching relationships for student ${studentId}:`, error);
      return { data: null, error };
    }
  },

  // Get all relationships for a specific school
  getRelationshipsBySchoolId: async (schoolId) => {
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

      // Make fetch request to Supabase REST API to get relationships by school ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_schools?school_id=eq.${schoolId}&select=*`,
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
        const errorText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status}${errorText ? ` - ${errorText}` : ""}`
        );
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error(`Error fetching relationships for school ${schoolId}:`, error);
      return { data: null, error };
    }
  },

  // Get relationship by ID
  getRelationshipById: async (id) => {
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

      // Make fetch request to Supabase REST API to get relationship by ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_schools?id=eq.${id}&select=*`,
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
      const relationship = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return { data: relationship, error: null };
    } catch (error) {
      console.error(`Error fetching relationship with id ${id}:`, error);
      return { data: null, error };
    }
  },

  // Update a student-school relationship
  updateRelationship: async (id, updates) => {
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

      const payload = { ...updates };
      if (!Object.prototype.hasOwnProperty.call(payload, "instructor_id") && payload.granted_by_admin_id) {
        payload.instructor_id = payload.granted_by_admin_id;
      }

      // Make fetch request to Supabase REST API to update relationship
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_student_schools?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error(`Error updating relationship ${id}:`, error);
      return { data: null, error };
    }
  },

  // Delete a student-school relationship
  deleteRelationship: async (id) => {
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

      // Make fetch request to Supabase REST API to delete relationship
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_student_schools?id=eq.${id}`, {
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
      console.error(`Error deleting relationship ${id}:`, error);
      return { error };
    }
  },

  // Get relationship by passcode and student ID (for login verification)
  getRelationshipByPasscodeAndStudent: async (studentId, passcode) => {
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

      // Make fetch request to Supabase REST API to get relationship by passcode and student ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_schools?student_id=eq.${studentId}&passcode=eq.${passcode}&select=*`,
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
      const relationship = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return { data: relationship, error: null };
    } catch (error) {
      console.error(`Error fetching relationship with student ID ${studentId} and passcode:`, error);
      return { data: null, error };
    }
  },

  // Get relationship by passcode, student ID and school ID (for specific school login verification)
  getRelationshipByPasscodeStudentAndSchool: async (studentId, schoolId, passcode) => {
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

      // Make fetch request to Supabase REST API to get relationship by passcode, student ID and school ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_schools?student_id=eq.${studentId}&school_id=eq.${schoolId}&passcode=eq.${passcode}&select=*`,
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
      const relationship = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return { data: relationship, error: null };
    } catch (error) {
      console.error(`Error fetching relationship with student ID ${studentId}, school ID ${schoolId} and passcode:`, error);
      return { data: null, error };
    }
  },

  // Get relationship by verification key (for access verification)
  getRelationshipByVerificationKey: async (verificationKey) => {
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

      // Make fetch request to Supabase REST API to get relationship by verification key
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_schools?verification_key=eq.${encodeURIComponent(verificationKey)}&select=*`,
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
      const relationship = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return { data: relationship, error: null };
    } catch (error) {
      console.error(`Error fetching relationship with verification key ${verificationKey}:`, error);
      return { data: null, error };
    }
  },

  // Get students by admin ID and school ID
  getStudentsByAdminId: async (adminId, schoolId) => {
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

      // Make fetch request to Supabase REST API to get students by admin ID and school ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_schools?granted_by_admin_id=eq.${adminId}&school_id=eq.${schoolId}&select=*`,
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
      console.error(`Error fetching students for admin ${adminId} and school ${schoolId}:`, error);
      return { data: null, error };
    }
  }
};
