// services/studentService.js
import { SUPABASE_CONFIG } from "../services/supabase";

const studentService = {
  async deleteStudentCascade(studentId) {
    try {
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_URL environment variable");
      }

      if (!supabaseAnonKey) {
        throw new Error("Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable");
      }

      const deleteByFilter = async (table, filterQuery, label) => {
        const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${filterQuery}`, {
          method: "DELETE",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const detail = await response.text();
          const detailLower = detail ? detail.toLowerCase() : "";
          const isMissingTable =
            response.status === 404 &&
            (detailLower.includes("does not exist") || detailLower.includes("undefined_table"));

          if (isMissingTable) {
            return;
          }

          throw new Error(
            `${label} delete failed (HTTP ${response.status})${detail ? `: ${detail}` : ""}`
          );
        }
      };

      // Delete dependent records first to avoid FK conflicts
      await deleteByFilter("drv_student_progress", `student_id=eq.${studentId}`, "Student progress");
      await deleteByFilter("drv_payments", `student_id=eq.${studentId}`, "Student payments");
      await deleteByFilter("drv_referral_rewards", `student_id=eq.${studentId}`, "Referral rewards");
      await deleteByFilter(
        "drv_referrals",
        `or=(referrer_student_id.eq.${studentId},referred_student_id.eq.${studentId})`,
        "Referrals"
      );
      await deleteByFilter("drv_subscriptions", `student_id=eq.${studentId}`, "Subscriptions");
      await deleteByFilter("drv_student_invite_links", `student_id=eq.${studentId}`, "Student invite links");
      await deleteByFilter("drv_student_schools", `student_id=eq.${studentId}`, "Student-school relationships");

      // Finally, delete the student record
      await deleteByFilter("drv_students", `id=eq.${studentId}`, "Student");

      return { error: null };
    } catch (error) {
      console.error("Error deleting student with cascade:", error);
      return { error };
    }
  },
  // Get student by ID
  async getStudentById(studentId) {
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

      // Make fetch request to Supabase REST API to get student by ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_students?id=eq.${studentId}&select=*`,
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
      const student = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return { data: student, error: null };
    } catch (error) {
      console.error('Error fetching student:', error);
      return { data: null, error };
    }
  },

  // Update student information
  async updateStudent(studentId, updateData) {
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

      // Make fetch request to Supabase REST API to update student
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_students?id=eq.${studentId}`, {
        method: "PATCH",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error('Error updating student:', error);
      return { data: null, error };
    }
  },

  // Get students by school ID - Updated to use the new relationship table
  async getStudentsBySchoolId(schoolId) {
    // Check if schoolId is valid before making the API call
    if (!schoolId || schoolId === 'undefined' || schoolId === undefined) {
      console.error('Invalid school ID provided to getStudentsBySchoolId:', schoolId);
      return { data: [], error: new Error('Invalid school ID') };
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

      // Make fetch request to Supabase REST API to get students by school ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_schools?school_id=eq.${schoolId}&select=id,student_id,school_id,approved,archived,passcode,created_at,updated_at,granted_by_admin_id,instructor_id,drv_students(*)`,
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

      const instructorIds = [
        ...new Set(
          data
            .map((item) => item.instructor_id || item.granted_by_admin_id)
            .filter((adminId) => !!adminId)
        ),
      ];

      let instructorById = {};
      if (instructorIds.length > 0) {
        const adminResponse = await fetch(
          `${supabaseUrl}/rest/v1/drv_admins?id=in.(${instructorIds.join(",")})&select=id,name,email`,
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

        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          instructorById = (adminData || []).reduce((acc, admin) => {
            acc[admin.id] = admin;
            return acc;
          }, {});
        }
      }

      // Format the data to match the expected structure
      const formattedData = data.map(item => {
        const linkedInstructorId =
          item.instructor_id || item.granted_by_admin_id || null;

        return {
        id: item.drv_students.id,
        name: item.drv_students.name,
        phone: item.drv_students.phone,
        email: item.drv_students.email,
        progress: item.drv_students.progress,
        whatsapp_template_history: Array.isArray(item.drv_students.whatsapp_template_history)
          ? item.drv_students.whatsapp_template_history
          : [],
        created_at: item.drv_students.created_at,
        updated_at: item.drv_students.updated_at,
        // Add the relationship-specific fields
        student_school_id: item.id,
        approved: item.approved,
        archived: item.archived,
        passcode: item.passcode,
        instructor_id: linkedInstructorId,
        granted_by_admin_id: item.granted_by_admin_id || null,
        linked_instructor_name:
          instructorById[linkedInstructorId]?.name ||
          instructorById[linkedInstructorId]?.email ||
          null,
        linked_instructor_email:
          instructorById[linkedInstructorId]?.email || null,
        student_school_created_at: item.created_at,
        student_school_updated_at: item.updated_at
        };
      });

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error fetching students:', error);
      return { data: null, error };
    }
  },

  // Get approved schools for a specific student
  async getApprovedSchoolsForStudent(studentId) {
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

      // Make fetch request to Supabase REST API to get approved schools for a student
      // Include expires_at field from the relationship table
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_student_schools?student_id=eq.${studentId}&approved=eq.true&archived=eq.false&select=id,student_id,school_id,approved,archived,passcode,created_at,updated_at,expires_at,drv_schools(id,name,description,logo_url,cover_image_url,admin_id,created_at,updated_at,address,area,district,details)`,
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

      // Format the data to match the expected structure
      const formattedData = data.map(item => ({
        student_school_id: item.id,
        student_id: item.student_id,
        school_id: item.school_id,
        approved: item.approved,
        archived: item.archived,
        passcode: item.passcode,
        created_at: item.created_at,
        updated_at: item.updated_at,
        expires_at: item.expires_at, // Add the expires_at field from the relationship
        school: {
          id: item.drv_schools.id,
          name: item.drv_schools.name,
          description: item.drv_schools.description,
          logo_url: item.drv_schools.logo_url,
          cover_image_url: item.drv_schools.cover_image_url,
          created_at: item.drv_schools.created_at,
          updated_at: item.drv_schools.updated_at
        }
      }));

      return { data: formattedData, error: null };
    } catch (error) {
      console.error('Error fetching approved schools for student:', error);
      return { data: null, error };
    }
  },

  // Create a new student
  async createStudent(studentData) {
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

      // Make fetch request to Supabase REST API to create student
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_students`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error('Error creating student:', error);
      return { data: null, error };
    }
  },

  // Find student by email
  async findStudentByEmail(email) {
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

      // Make fetch request to Supabase REST API to find student by email
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_students?email=eq.${encodeURIComponent(email)}&select=*`,
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
      const student = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return { data: student, error: null };
    } catch (error) {
      console.error('Error finding student by email:', error);
      return { data: null, error };
    }
  },

  // Find student by phone number (with partial matching)
  async findStudentByPhone(phone) {
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

      // Make fetch request to Supabase REST API to find student by phone (using ilike for partial matching)
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_students?phone=ilike.*${encodeURIComponent(phone)}*&select=*`,
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
      const student = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return { data: student, error: null };
    } catch (error) {
      console.error('Error finding student by phone:', error);
      return { data: null, error };
    }
  },

  // Upsert student record (insert or update based on conflict)
  async upsertStudent(studentData, conflictField = 'email') {
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

      // Make fetch request to Supabase REST API to upsert student
      // Using POST with Prefer header for upsert operation
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_students`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation,resolution=merge-duplicates",
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return { data: Array.isArray(data) && data.length > 0 ? data[0] : data, error: null };
    } catch (error) {
      console.error('Error upserting student:', error);
      return { data: null, error };
    }
  },

  // Delete a student
  async deleteStudent(studentId) {
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

      // Make fetch request to Supabase REST API to delete student
      const response = await fetch(`${supabaseUrl}/rest/v1/drv_students?id=eq.${studentId}`, {
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

      // DELETE requests may return empty body (204 No Content)
      // Check if response has content before parsing JSON
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
      console.error('Error deleting student:', error);
      return { data: null, error };
    }
  }
};

export { studentService };
