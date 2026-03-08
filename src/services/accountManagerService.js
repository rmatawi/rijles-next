// src/services/accountManagerService.js
import { SUPABASE_CONFIG } from "./supabase";

// Account Manager operations using fetch API instead of Supabase client
export const accountManagerService = {
  // Create a new account manager
  createAccountManager: async (accountManagerData) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to create account manager
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_accountmanagers`,
        {
          method: "POST",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(accountManagerData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error("Error creating account manager:", error);
      return { data: null, error };
    }
  },

  // Get account manager by email
  getAccountManagerByEmail: async (email) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to get account manager by email
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_accountmanagers?email=eq.${encodeURIComponent(
          email
        )}&select=*`,
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
        if (response.status === 200) {
          const data = await response.json();
          return {
            data: Array.isArray(data) && data.length > 0 ? data[0] : null,
            error: null,
          };
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : null,
        error: null,
      };
    } catch (error) {
      console.error(
        `Error fetching account manager with email ${email}:`,
        error
      );
      return { data: null, error };
    }
  },

  // Get account manager by ID
  getAccountManagerById: async (id) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to get account manager by ID
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_accountmanagers?id=eq.${id}&select=*`,
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
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error(`Error fetching account manager with id ${id}:`, error);
      return { data: null, error };
    }
  },

  // Get all account managers
  getAllAccountManagers: async () => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to get all account managers
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_accountmanagers?order=created_at.desc&select=*`,
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
      console.error("Error fetching account managers:", error);
      return { data: null, error };
    }
  },

  // Get account managers by status
  getAccountManagersByStatus: async (status) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to get account managers by status
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_accountmanagers?status=eq.${status}&order=created_at.desc&select=*`,
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
      console.error(
        `Error fetching account managers with status ${status}:`,
        error
      );
      return { data: null, error };
    }
  },

  // Update an account manager
  updateAccountManager: async (id, accountManagerData) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to update account manager
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_accountmanagers?id=eq.${id}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(accountManagerData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error(`Error updating account manager ${id}:`, error);
      return { data: null, error };
    }
  },

  // Update account manager status
  updateAccountManagerStatus: async (id, status) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to update account manager status
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_accountmanagers?id=eq.${id}`,
        {
          method: "PATCH",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : data,
        error: null,
      };
    } catch (error) {
      console.error(`Error updating account manager status ${id}:`, error);
      return { data: null, error };
    }
  },

  // Delete an account manager
  deleteAccountManager: async (id) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to delete account manager
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_accountmanagers?id=eq.${id}`,
        {
          method: "DELETE",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return { error: null };
    } catch (error) {
      console.error(`Error deleting account manager ${id}:`, error);
      return { error };
    }
  },

  // Get account manager by referral code
  getAccountManagerByReferralCode: async (referralCode) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Make fetch request to Supabase REST API to get account manager by referral code
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_accountmanagers?referral_code=eq.${encodeURIComponent(
          referralCode
        )}&select=*`,
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
        if (response.status === 200) {
          const data = await response.json();
          return {
            data: Array.isArray(data) && data.length > 0 ? data[0] : null,
            error: null,
          };
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return {
        data: Array.isArray(data) && data.length > 0 ? data[0] : null,
        error: null,
      };
    } catch (error) {
      console.error(
        `Error fetching account manager with referral code ${referralCode}:`,
        error
      );
      return { data: null, error };
    }
  },

  // Link an admin to an account manager using referral code
  linkAdminToAccountManager: async (referralCode, adminEmail) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // First, find the account manager by referral code
      const { data: accountManager, error: accountManagerError } =
        await accountManagerService.getAccountManagerByReferralCode(
          referralCode
        );

      if (accountManagerError) {
        throw new Error(
          `Account manager not found with referral code: ${accountManagerError.message}`
        );
      }

      if (!accountManager) {
        throw new Error(
          `No account manager found with referral code: ${referralCode}`
        );
      }

      // Find the admin by email
      const { data: admin, error: adminError } =
        await adminService.getAdminByEmail(adminEmail);

      if (adminError || !admin) {
        throw new Error(
          `Admin not found: ${adminError?.message || "Admin does not exist"}`
        );
      }

      // Update the admin record to link it to the account manager
      const updateResult = await adminService.updateAdmin(admin.id, {
        account_manager_id: accountManager.id,
        referral_account_manager_id: accountManager.id, // Also set the referral account manager
        updated_at: new Date().toISOString(),
      });

      if (updateResult.error) {
        throw new Error(updateResult.error.message);
      }

      return {
        success: true,
        error: null,
        accountManager,
        admin: updateResult.data,
      };
    } catch (error) {
      console.error(
        `Error linking admin ${adminEmail} to account manager via referral code ${referralCode}:`,
        error
      );
      return { success: false, error };
    }
  },

  // Get stats for an account manager (number of referred admins)
  getAccountManagerStats: async (accountManagerId) => {
    try {
      // Access environment variables from centralized configuration
      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_URL environment variable"
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          "Missing VITE_REACT_APP_SUPABASE_ANON_KEY environment variable"
        );
      }

      // Count the number of admins referred by this account manager
      const response = await fetch(
        `${supabaseUrl}/rest/v1/drv_admins?referral_account_manager_id=eq.${accountManagerId}&select=count`,
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
      const referredAdminsCount =
        Array.isArray(data) && data.length > 0 ? data[0].count : 0;

      // Also get basic account manager info
      const { data: accountManager, error: accountManagerError } =
        await accountManagerService.getAccountManagerById(accountManagerId);

      if (accountManagerError) {
        throw new Error(
          `Error fetching account manager: ${accountManagerError.message}`
        );
      }

      return {
        data: {
          accountManager,
          referredAdminsCount,
          totalAdmins: referredAdminsCount, // For future use
        },
        error: null,
      };
    } catch (error) {
      console.error(
        `Error fetching account manager stats for id ${accountManagerId}:`,
        error
      );
      return { data: null, error };
    }
  },
};
