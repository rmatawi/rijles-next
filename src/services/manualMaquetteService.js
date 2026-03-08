import { SUPABASE_CONFIG } from "./supabase";

const getSupabaseConfig = () => {
  const supabaseUrl = SUPABASE_CONFIG.URL;
  const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
  }

  return { supabaseUrl, supabaseAnonKey };
};

export const manualMaquetteService = {
  getManualMaquettesBySchoolId: async (schoolId) => {
    try {
      if (!schoolId) {
        return { data: null, error: null };
      }

      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
      const url = `${supabaseUrl}/rest/v1/drv_manual_maquettes?driving_school_id=eq.${encodeURIComponent(
        schoolId
      )}&select=*`;

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
        if (response.status === 406) {
          return { data: null, error: null };
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const processedData = Array.isArray(data) && data.length > 0 ? data[0] : data;

      return {
        data: processedData,
        error: null,
      };
    } catch (error) {
      console.error("Error fetching manual maquettes:", error);
      return { data: null, error };
    }
  },

  upsertManualMaquettes: async (schoolId, manualData) => {
    try {
      if (!schoolId) {
        return { data: null, error: null };
      }

      const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
      const url = `${supabaseUrl}/rest/v1/drv_manual_maquettes?on_conflict=driving_school_id`;

      const payload = {
        driving_school_id: schoolId,
        manual_data: manualData,
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation,resolution=merge-duplicates",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error("Error upserting manual maquettes:", error);
      return { data: null, error };
    }
  },
};
