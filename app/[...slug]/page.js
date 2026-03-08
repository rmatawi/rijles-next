import LegacyShell from "../_components/LegacyShell";
import { getRouteMetadata } from "../_lib/routeMetadata";

export function generateMetadata({ params }) {
  const slug = params?.slug || [];
  const pageKey = slug[0] || "home";
  const fallbackPath = `/${slug.join("/")}`;
  return getRouteMetadata(pageKey, fallbackPath);
}

export default function CatchAllPage() {
  return <LegacyShell />;
}
