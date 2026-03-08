import LegacyShell from "../_components/LegacyShell";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getRouteMetadata, knownPageKeys } from "../_lib/routeMetadata";
import { resolveSiteUrl } from "../_lib/seoConfig";

const getPageKey = (params) => (params?.slug?.[0] || "").toLowerCase();
const resolveParams = async (params) => (params ? await params : {});

export async function generateMetadata({ params }) {
  const siteUrl = resolveSiteUrl(await headers());
  const resolvedParams = await resolveParams(params);
  const slug = resolvedParams?.slug || [];
  const pageKey = getPageKey(resolvedParams);

  if (!pageKey || !knownPageKeys.has(pageKey)) {
    return getRouteMetadata("home", "/", siteUrl);
  }

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

export default async function CatchAllPage({ params }) {
  const resolvedParams = await resolveParams(params);
  const pageKey = getPageKey(resolvedParams);

  if (!pageKey || !knownPageKeys.has(pageKey)) {
    notFound();
  }

  return <LegacyShell />;
}
