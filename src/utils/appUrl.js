const normalizeBaseUrl = (baseUrl) => {
  const fallback =
    typeof window !== "undefined" ? window.location.origin : "http://localhost";
  return (baseUrl || fallback).replace(/\/+$/, "");
};

const appendQuery = (path, params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
};

export const buildHybridParamPath = (key, value, queryParams = {}) => {
  const safeKey = encodeURIComponent(String(key || ""));
  const safeValue = encodeURIComponent(String(value || ""));
  const path = `/${safeKey}/${safeValue}`;
  return appendQuery(path, queryParams);
};

export const buildPagePath = (page, queryParams = {}) =>
  buildHybridParamPath("page", page, queryParams);

export const buildSharePath = (shareCode, queryParams = {}) =>
  buildHybridParamPath("share", shareCode, queryParams);

export const buildAdminPath = (adminValue, queryParams = {}) =>
  buildHybridParamPath("admin", adminValue, queryParams);

export const buildAbsoluteUrl = (path, baseUrl) =>
  `${normalizeBaseUrl(baseUrl)}${path.startsWith("/") ? path : `/${path}`}`;

export const buildAbsolutePageUrl = (page, queryParams = {}, baseUrl) =>
  buildAbsoluteUrl(buildPagePath(page, queryParams), baseUrl);

export const buildAbsoluteShareUrl = (shareCode, queryParams = {}, baseUrl) =>
  buildAbsoluteUrl(buildSharePath(shareCode, queryParams), baseUrl);

export const isShareUrl = (urlValue = "") => {
  if (!urlValue) return false;

  try {
    const parsed = new URL(urlValue, "http://localhost");
    return Boolean(parsed.searchParams.get("share")) || /^\/share\/[^/]+/i.test(parsed.pathname);
  } catch (error) {
    return urlValue.includes("?share=") || /\/share\/[^/]+/i.test(urlValue);
  }
};

