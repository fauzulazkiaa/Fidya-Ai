import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import AboutPageContent from "./page-content";

export const metadata: Metadata = buildMetadata("about");

export default function AboutPage() {
  return <AboutPageContent />;
}
