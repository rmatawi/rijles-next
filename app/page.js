import LegacyShell from "./_components/LegacyShell";
import { headers } from "next/headers";
import { getRouteMetadata } from "./_lib/routeMetadata";
import { resolveSiteUrl } from "./_lib/seoConfig";

export async function generateMetadata() {
  const siteUrl = resolveSiteUrl(await headers());
  return getRouteMetadata("home", "/", siteUrl);
}

export default function Home() {
  return <LegacyShell />;
}
