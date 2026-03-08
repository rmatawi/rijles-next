import { supabase } from "./supabase";

/**
 * Generate a random short ID (8 characters)
 */
const generateShortId = () => {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Create or get existing short URL for a maquette
 * @param {string} maquetteId - The maquette UUID
 * @returns {Promise<{data: {short_id: string}, error: any}>}
 */
const createShortUrl = async (maquetteId) => {
  try {
    // Check if short URL already exists for this maquette
    const { data: existing, error: fetchError } = await supabase
      .from("short_urls")
      .select("short_id")
      .eq("maquette_id", maquetteId)
      .single();

    if (existing) {
      return { data: existing, error: null };
    }

    // Generate new short ID (retry if collision)
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const shortId = generateShortId();

      const { data, error } = await supabase
        .from("short_urls")
        .insert({
          short_id: shortId,
          maquette_id: maquetteId,
        })
        .select("short_id")
        .single();

      if (error) {
        // If unique constraint violation, try again with new ID
        if (error.code === "23505") {
          attempts++;
          continue;
        }
        return { data: null, error };
      }

      return { data, error: null };
    }

    return {
      data: null,
      error: new Error("Failed to generate unique short ID"),
    };
  } catch (err) {
    console.error("Error creating short URL:", err);
    return { data: null, error: err };
  }
};

/**
 * Get maquette ID from short ID
 * @param {string} shortId - The short ID
 * @returns {Promise<{data: {maquette_id: string}, error: any}>}
 */
const getMaquetteIdFromShortId = async (shortId) => {
  try {
    const { data, error } = await supabase
      .from("short_urls")
      .select("maquette_id")
      .eq("short_id", shortId)
      .single();

    if (error) {
      return { data: null, error };
    }

    // Update hit count and last accessed time atomically using RPC
    await supabase.rpc("increment_short_url_hit", {
      short_id_param: shortId,
    });

    return { data, error: null };
  } catch (err) {
    console.error("Error getting maquette ID from short ID:", err);
    return { data: null, error: err };
  }
};

export const shortUrlService = {
  createShortUrl,
  getMaquetteIdFromShortId,
  generateShortId,
};
