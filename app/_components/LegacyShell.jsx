 "use client";

import dynamic from "next/dynamic";

const LegacyApp = dynamic(() => import("../LegacyApp"), { ssr: false });

export default function LegacyShell() {
  return <LegacyApp />;
}
