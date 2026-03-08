import { headers } from "next/headers";
import { getIndexablePaths } from "./_lib/routeMetadata";
import { resolveSiteUrl } from "./_lib/seoConfig";

const priorityByPath = {
  "/": 1,
  "/home": 0.9,
  "/rijscholen": 0.9,
  "/services": 0.9,
  "/maquette": 0.8,
  "/qa": 0.8,
  "/verkeersborden": 0.8,
  "/videos": 0.7,
  "/free-trial-signup": 0.7,
  "/insurance": 0.7,
  "/campaign": 0.6,
  "/emergency": 0.6,
  "/about": 0.6,
  "/referral": 0.5,
  "/student-login": 0.4,
};

export default async function sitemap() {
  const siteUrl = resolveSiteUrl(await headers());
  const now = new Date();

  return getIndexablePaths().map((path) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: priorityByPath[path] || 0.5,
  }));
}
