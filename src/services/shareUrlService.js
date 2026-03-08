import { SUPABASE_CONFIG } from "./supabase";
import { buildAbsoluteShareUrl } from "../utils/appUrl";
const logInstructorTrace = () => {};

/**
 * Generate a random short code for share URLs (8-12 characters)
 */
const generateShortCode = (length = 8) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Create a short share URL for admin sharing
 * @param {string} fullUrl - The full URL with admin_id and school parameters
 * @param {string} createdBy - UUID of the admin creating the share
 * @param {Date} expiresAt - Optional expiration date
 * @returns {Promise<{data: {short_code: string, share_url: string}, error: any}>}
 */
const createShareUrl = async (fullUrl, createdBy = null, expiresAt = null) => {
  try {
    logInstructorTrace("createShareUrl:start", {
      fullUrlBefore: fullUrl,
      createdBy,
      expiresAt: expiresAt?.toISOString?.() || null,
    });

    // If createdBy is provided, only add it when admin_id is missing.
    // Do not override an existing admin_id already present in the URL.
    if (createdBy) {
      if (!fullUrl.includes('admin_id=')) {
        // Append it if missing
        const separator = fullUrl.includes('?') ? '&' : '?';
        fullUrl += `${separator}admin_id=${createdBy}`;
        logInstructorTrace("createShareUrl:adminIdAppended", {
          createdBy,
          fullUrlAfterAppend: fullUrl,
        });
      } else {
        logInstructorTrace("createShareUrl:adminIdPreserved", {
          existingAdminIdInUrl: true,
          fullUrlUnchanged: fullUrl,
        });
      }
    }
    // Generate unique short code (retry if collision)
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const shortCode = generateShortCode();

      const supabaseUrl = SUPABASE_CONFIG.URL;
      const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Missing Supabase configuration");
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/drv_share_urls`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          short_code: shortCode,
          full_url: fullUrl,
          created_by: createdBy,
          expires_at: expiresAt?.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const shareUrl = buildAbsoluteShareUrl(shortCode);
        logInstructorTrace("createShareUrl:success", {
          shortCode,
          shareUrl,
          fullUrlStored: fullUrl,
        });

        return {
          data: {
            short_code: shortCode,
            share_url: shareUrl,
            full_url: fullUrl,
          },
          error: null
        };
      } else {
        const errorData = await response.json();
        logInstructorTrace("createShareUrl:errorResponse", {
          status: response.status,
          errorData,
        });
        // If unique constraint violation, try again with new code
        if (errorData.code === "23505" || errorData.message?.includes("duplicate")) {
          attempts++;
          continue;
        }
        return { data: null, error: errorData };
      }
    }

    return {
      data: null,
      error: new Error("Failed to generate unique short code"),
    };
  } catch (err) {
    console.error("Error creating share URL:", err);
    return { data: null, error: err };
  }
};

/**
 * Get full URL from short code
 * @param {string} shortCode - The short code from a share URL
 * @returns {Promise<{data: {full_url: string}, error: any}>}
 */
const getFullUrlFromShortCode = async (shortCode) => {
  try {
    const supabaseUrl = SUPABASE_CONFIG.URL;
    const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Get the share URL record
    const response = await fetch(
      `${supabaseUrl}/rest/v1/drv_share_urls?short_code=eq.${shortCode}&is_active=eq.true`,
      {
        method: "GET",
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

    const data = await response.json();

    if (!data || data.length === 0) {
      return { data: null, error: new Error("Share URL not found or expired") };
    }

    const shareRecord = data[0];

    // Check if expired
    if (shareRecord.expires_at && new Date(shareRecord.expires_at) < new Date()) {
      return { data: null, error: new Error("Share URL has expired") };
    }

    // Update usage count and last used time
    await fetch(`${supabaseUrl}/rest/v1/drv_share_urls?id=eq.${shareRecord.id}`, {
      method: "PATCH",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usage_count: (shareRecord.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      }),
    });

    return { data: { full_url: shareRecord.full_url }, error: null };
  } catch (err) {
    console.error("Error getting full URL from short code:", err);
    return { data: null, error: err };
  }
};

/**
 * Clean up expired share URLs (admin function)
 * @returns {Promise<{data: {deleted_count: number}, error: any}>}
 */
const cleanupExpiredShareUrls = async () => {
  try {
    const supabaseUrl = SUPABASE_CONFIG.URL;
    const supabaseAnonKey = SUPABASE_CONFIG.ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/cleanup_expired_share_urls`, {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return { data: { deleted_count: data }, error: null };
  } catch (err) {
    console.error("Error cleaning up expired share URLs:", err);
    return { data: null, error: err };
  }
};

export const shareUrlService = {
  createShareUrl,
  getFullUrlFromShortCode,
  cleanupExpiredShareUrls,
  generateShortCode,
};
