import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import PrivacyPageContent from "./page-content";

export const metadata: Metadata = buildMetadata("privacy");

export default function PrivacyPage() {
  return <PrivacyPageContent />;
}
