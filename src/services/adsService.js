import { supabase } from "./supabase";

const ADS_TABLE = "drv_ads";
const ADS_EVENTS_TABLE = "drv_ad_events";
const CACHE_TTL_MS = 60 * 1000;
const adsCache = new Map();
const AD_SESSION_STORAGE_KEY = "ad_tracking_session_id";

const isActiveNow = (ad, nowIso) => {
  const nowMs = Date.parse(nowIso);
  const startsAtMs = ad?.starts_at ? Date.parse(ad.starts_at) : null;
  const endsAtMs = ad?.ends_at ? Date.parse(ad.ends_at) : null;

  if (startsAtMs && Number.isFinite(startsAtMs) && startsAtMs > nowMs) {
    return false;
  }
  if (endsAtMs && Number.isFinite(endsAtMs) && endsAtMs < nowMs) {
    return false;
  }
  return true;
};

const sortAds = (ads) =>
  [...ads].sort((a, b) => {
    const priorityA = Number.isFinite(a?.priority) ? a.priority : 0;
    const priorityB = Number.isFinite(b?.priority) ? b.priority : 0;
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    const createdAtA = a?.created_at ? Date.parse(a.created_at) : 0;
    const createdAtB = b?.created_at ? Date.parse(b.created_at) : 0;
    return createdAtB - createdAtA;
  });

const normalizeSlot = (slot) => String(slot || "general").trim().toLowerCase();

const filterAdsForSlot = (ads, slot) => {
  const requestedSlot = normalizeSlot(slot);
  const nowIso = new Date().toISOString();
  return sortAds(
    ads.filter((ad) => {
      if (!ad?.is_active) return false;
      if (!isActiveNow(ad, nowIso)) return false;
      const adSlot = normalizeSlot(ad.slot);
      if (requestedSlot === "general") {
        return adSlot === "general";
      }
      return adSlot === requestedSlot || adSlot === "general";
    }),
  );
};

const cacheKey = (slot) => `slot:${normalizeSlot(slot)}`;

const generateSessionId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const getSessionId = () => {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(AD_SESSION_STORAGE_KEY);
  if (existing) return existing;
  const sessionId = generateSessionId();
  window.localStorage.setItem(AD_SESSION_STORAGE_KEY, sessionId);
  return sessionId;
};

export const adsService = {
  clearCache: () => adsCache.clear(),

  getAllAds: async () => {
    try {
      const { data, error } = await supabase
        .from(ADS_TABLE)
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Error fetching ads:", error);
      return { data: [], error };
    }
  },

  createAd: async (payload) => {
    try {
      const { data, error } = await supabase
        .from(ADS_TABLE)
        .insert([payload])
        .select("*")
        .single();

      if (error) throw error;
      adsCache.clear();
      return { data, error: null };
    } catch (error) {
      console.error("Error creating ad:", error);
      return { data: null, error };
    }
  },

  updateAd: async (id, payload) => {
    try {
      const { data, error } = await supabase
        .from(ADS_TABLE)
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      adsCache.clear();
      return { data, error: null };
    } catch (error) {
      console.error(`Error updating ad ${id}:`, error);
      return { data: null, error };
    }
  },

  deleteAd: async (id) => {
    try {
      const { error } = await supabase.from(ADS_TABLE).delete().eq("id", id);
      if (error) throw error;
      adsCache.clear();
      return { error: null };
    } catch (error) {
      console.error(`Error deleting ad ${id}:`, error);
      return { error };
    }
  },

  getActiveAdsBySlot: async (slot = "general") => {
    const key = cacheKey(slot);
    const now = Date.now();
    const cached = adsCache.get(key);
    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
      return { data: cached.data, error: null };
    }

    try {
      const { data, error } = await supabase
        .from(ADS_TABLE)
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const filtered = filterAdsForSlot(data || [], slot);
      adsCache.set(key, { data: filtered, cachedAt: now });
      return { data: filtered, error: null };
    } catch (error) {
      console.error(`Error fetching active ads for slot '${slot}':`, error);
      return { data: [], error };
    }
  },

  getRandomActiveAdBySlot: async (slot = "general") => {
    const { data, error } = await adsService.getActiveAdsBySlot(slot);
    if (error || !Array.isArray(data) || data.length === 0) {
      return { data: null, error };
    }
    const randomIndex = Math.floor(Math.random() * data.length);
    return { data: data[randomIndex], error: null };
  },

  recordAdEvent: async ({
    adId,
    eventType,
    slot = "general",
    targetUrl = null,
    pagePath = null,
  }) => {
    if (!adId || !eventType) {
      return { error: new Error("adId and eventType are required") };
    }

    try {
      const resolvedPagePath =
        pagePath ||
        (typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search || ""}`
          : null);

      const payload = {
        ad_id: adId,
        event_type: eventType,
        slot: normalizeSlot(slot),
        target_url: targetUrl,
        page_path: resolvedPagePath,
        session_id: getSessionId(),
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent || null : null,
      };

      const { error } = await supabase.from(ADS_EVENTS_TABLE).insert([payload]);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error recording ad event:", error);
      return { error };
    }
  },

  getAdEventCounts: async (adIds = []) => {
    if (!Array.isArray(adIds) || adIds.length === 0) {
      return { data: {}, error: null };
    }

    try {
      const { data, error } = await supabase
        .from(ADS_EVENTS_TABLE)
        .select("ad_id,event_type")
        .in("ad_id", adIds)
        .limit(50000);

      if (error) throw error;

      const counts = {};
      for (const adId of adIds) {
        counts[adId] = { impressions: 0, clicks: 0 };
      }

      for (const item of data || []) {
        if (!counts[item.ad_id]) {
          counts[item.ad_id] = { impressions: 0, clicks: 0 };
        }
        if (item.event_type === "impression") {
          counts[item.ad_id].impressions += 1;
        } else if (item.event_type === "click") {
          counts[item.ad_id].clicks += 1;
        }
      }

      return { data: counts, error: null };
    } catch (error) {
      console.error("Error fetching ad event counts:", error);
      return { data: {}, error };
    }
  },
};
