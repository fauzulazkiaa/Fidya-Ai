import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import TermsPageContent from "./page-content";

export const metadata: Metadata = buildMetadata("terms");

export default function TermsPage() {
  return <TermsPageContent />;
}
