import { headers } from "next/headers";
import { resolveSiteUrl } from "./_lib/seoConfig";

export default async function robots() {
  const siteUrl = resolveSiteUrl(await headers());

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
