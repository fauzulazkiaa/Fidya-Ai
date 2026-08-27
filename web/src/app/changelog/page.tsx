import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import ChangelogPageContent from "./page-content";

export const metadata: Metadata = buildMetadata("changelog");

export default function ChangelogPage() {
  return <ChangelogPageContent />;
}
