"use client";

import Framework7 from "framework7/lite-bundle";
import Framework7React from "framework7-react";
import MyApp from "../src/components/app";
import "framework7/css/bundle";
import "skeleton-elements/css";
import "../src/css/icons.css";
import "../src/css/app.css";

if (typeof window !== "undefined") {
  Framework7["use"](Framework7React);
}

export default function LegacyApp() {
  return <MyApp />;
}
