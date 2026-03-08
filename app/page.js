import LegacyShell from "./_components/LegacyShell";
import { getRouteMetadata } from "./_lib/routeMetadata";

export function generateMetadata() {
  return getRouteMetadata("home", "/");
}

export default function Home() {
  return <LegacyShell />;
}
