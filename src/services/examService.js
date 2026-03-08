// src/services/examService.js
import { SUPABASE_CONFIG } from "./supabase";

/**
 * Service for handling mock exam data operations
 */
export const examService = {
  /**
   * Upsert an exam record into the drv_exams table
   * @param {Object} examData - The exam data to save
   * @param {string} examData.school - The school identifier
   * @param {number} examData.exam - The exam number
   * @param {Array} examData.questions - Standard questions JSON array
   * @param {Array} examData.signs - Traffic sign questions JSON array
   * @param {Array} examData.maquettes - Maquette questions JSON array
   */
  upsertExam: async (examData) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase internal configuration is missing");
      }

      // Prepare payload to match the drv_exams table schema
      const payload = {
        school: examData.school,
        exam: examData.exam,
        questions: examData.questions || [],
        signs: examData.signs || [],
        maquettes: examData.maquettes || [],
        updated_at: new Date().toISOString(),
      };

      // PostgREST upsert: POST with resolution=merge-duplicates
      // For Supabase, we use Prefer: resolution=merge-duplicates
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_exams`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error("Error upserting exam:", error);
      return { data: null, error };
    }
  },

  /**
   * Get an exam record by school and exam number
   * @param {string} school - The school identifier
   * @param {number} exam - The exam number
   */
  getExam: async (school, exam) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_exams?school=eq.${encodeURIComponent(school)}&exam=eq.${exam}&select=*`,
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
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : null,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching exam:", error);
      return { data: null, error };
    }
  },

  /**
   * Get all exam records for a specific school
   * @param {string} school - The school identifier
   */
  getAllExamsBySchool: async (school) => {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_exams?school=eq.${encodeURIComponent(school)}&select=*`,
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
      console.error("Error fetching all exams for school:", error);
      return { data: null, error };
    }
  }
};

