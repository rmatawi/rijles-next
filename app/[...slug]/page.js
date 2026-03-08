import LegacyShell from "../_components/LegacyShell";
import { headers } from "next/headers";
import { getRouteMetadata } from "../_lib/routeMetadata";
import { resolveSiteUrl } from "../_lib/seoConfig";

export async function generateMetadata({ params }) {
  const siteUrl = resolveSiteUrl(await headers());
  const slug = params?.slug || [];
  const pageKey = slug[0] || "home";
  const fallbackPath = `/${slug.join("/")}`;
  return getRouteMetadata(pageKey, fallbackPath, siteUrl);
}

export function generateStaticParams() {
  const staticSlugs = [
    "home",
    "qa",
    "verkeersborden",
    "maquette",
    "videos",
    "rijscholen",
    "services",
    "free-trial-signup",
    "referral",
    "about",
    "student-login",
    "insurance",
    "mockexams",
    "mockexamssequenced",
    "emergency",
    "campaign",
    "campaign-fresh",
    "adverteren",
  ];

  return staticSlugs.map((slug) => ({ slug: [slug] }));
}

export default function CatchAllPage() {
  return <LegacyShell />;
}
