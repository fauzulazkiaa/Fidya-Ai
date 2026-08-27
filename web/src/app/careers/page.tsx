import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import CareersPageContent from "./page-content";

export const metadata: Metadata = buildMetadata("careers");

export default function CareersPage() {
  return <CareersPageContent />;
}
