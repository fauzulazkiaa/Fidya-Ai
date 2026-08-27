import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { StudyGuidesContent } from "./page-content";

export const metadata: Metadata = buildMetadata("study_guides");

export default function StudyGuidesPage() {
  return <StudyGuidesContent />;
}
