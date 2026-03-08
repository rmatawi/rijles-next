const FALLBACK_SITE_URL = "http://localhost:3000";

const normalizeEnvValue = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
};

const getFirstEnv = (...keys) => {
  for (const key of keys) {
    const value = normalizeEnvValue(process.env[key]);
    if (value) return value;
  }
  return "";
};

const normalizeSiteUrl = (value) => {
  const raw = normalizeEnvValue(value);
  if (!raw) return "";

  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch (error) {
    try {
      return new URL(`https://${raw}`).toString().replace(/\/$/, "");
    } catch (secondError) {
      return "";
    }
  }
};

const toAbsoluteUrl = (value, siteUrl) => {
  const raw = normalizeEnvValue(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${siteUrl}${raw.startsWith("/") ? raw : `/${raw}`}`;
};

const getForwardedValue = (headersList, key) => {
  const raw = headersList?.get(key) || "";
  if (!raw) return "";
  return raw.split(",")[0]?.trim() || "";
};

export const getConfiguredSiteUrl = () =>
  normalizeSiteUrl(
    getFirstEnv("NEXT_PUBLIC_SITE_URL", "SITE_URL", "VITE_SEO_CANONICAL_URL")
  );

export const resolveSiteUrlFromHeaders = (headersList) => {
  const host =
    getForwardedValue(headersList, "x-forwarded-host") ||
    normalizeEnvValue(headersList?.get("host"));
  if (!host) return "";

  const protocol = getForwardedValue(headersList, "x-forwarded-proto") || "https";
  return normalizeSiteUrl(`${protocol}://${host}`);
};

export const resolveSiteUrl = (headersList) =>
  resolveSiteUrlFromHeaders(headersList) ||
  getConfiguredSiteUrl() ||
  FALLBACK_SITE_URL;

export const getSeoConfig = (siteUrl) => {
  const baseTitle = getFirstEnv("NEXT_PUBLIC_SEO_TITLE", "VITE_SEO_TITLE") || "Rijschool";
  const description =
    getFirstEnv("NEXT_PUBLIC_SEO_DESCRIPTION", "VITE_SEO_DESCRIPTION") ||
    "Rijschool - Professionele Rijinstructeurs.";
  const ogTitle = getFirstEnv("NEXT_PUBLIC_SEO_OG_TITLE", "VITE_SEO_OG_TITLE") || baseTitle;
  const ogImageRaw =
    getFirstEnv("NEXT_PUBLIC_SEO_OG_IMAGE", "VITE_SEO_OG_IMAGE") ||
    "/icons/apple-touch-icon.png";
  const ogImage = toAbsoluteUrl(ogImageRaw, siteUrl);

  return {
    siteUrl,
    baseTitle,
    description,
    ogTitle,
    ogImage,
    keywords: getFirstEnv("NEXT_PUBLIC_SEO_KEYWORDS", "VITE_SEO_KEYWORDS"),
    businessName:
      getFirstEnv("NEXT_PUBLIC_SEO_BUSINESS_NAME", "VITE_SEO_BUSINESS_NAME") || "Rijles",
    phone: getFirstEnv("NEXT_PUBLIC_SEO_PHONE", "VITE_SEO_PHONE"),
    email: getFirstEnv("NEXT_PUBLIC_SEO_EMAIL", "VITE_SEO_EMAIL"),
    logoUrl: getFirstEnv("NEXT_PUBLIC_SEO_LOGO_URL", "VITE_SEO_LOGO_URL"),
    addressLocality: getFirstEnv(
      "NEXT_PUBLIC_SEO_ADDRESS_LOCALITY",
      "VITE_SEO_ADDRESS_LOCALITY"
    ),
    addressCountry: getFirstEnv(
      "NEXT_PUBLIC_SEO_ADDRESS_COUNTRY",
      "VITE_SEO_ADDRESS_COUNTRY"
    ),
    ratingValue: getFirstEnv("NEXT_PUBLIC_SEO_RATING_VALUE", "VITE_SEO_RATING_VALUE"),
    reviewCount: getFirstEnv("NEXT_PUBLIC_SEO_REVIEW_COUNT", "VITE_SEO_REVIEW_COUNT"),
    googleVerification: getFirstEnv(
      "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION",
      "VITE_GOOGLE_SITE_VERIFICATION"
    ),
  };
};
