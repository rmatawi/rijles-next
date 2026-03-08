import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIG } from "./supabase";

// Initialize Supabase client
const supabaseUrl = SUPABASE_CONFIG.URL;
const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class QACategoriesService {
  async getCategoriesBySchoolId(drivingSchoolId) {
    const { data, error } = await supabase
      .from("drv_qa_categories")
      .select("*")
      .eq("driving_school_id", drivingSchoolId)
      .order("order_index", { ascending: true });

    if (error) {
      console.error("Error fetching QA categories:", error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  async createCategory(categoryData) {
    const { data, error } = await supabase
      .from("drv_qa_categories")
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      console.error("Error creating QA category:", error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  async updateCategory(id, categoryData) {
    const { data, error } = await supabase
      .from("drv_qa_categories")
      .update({
        ...categoryData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating QA category:", error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  async deleteCategory(id) {
    const { error } = await supabase
      .from("drv_qa_categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting QA category:", error);
      return { error };
    }

    return { error: null };
  }

  async deleteCategoriesBySchoolId(drivingSchoolId) {
    const { error } = await supabase
      .from("drv_qa_categories")
      .delete()
      .eq("driving_school_id", drivingSchoolId);

    if (error) {
      console.error("Error deleting QA categories by school ID:", error);
      return { error };
    }

    return { error: null };
  }
}

export const qaCategoriesService = new QACategoriesService();