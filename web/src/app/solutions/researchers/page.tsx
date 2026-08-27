import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { ResearchersContent } from "./page-content";

export const metadata: Metadata = buildMetadata("solutions_researchers");

export default function ResearchersPage() {
  return <ResearchersContent />;
}
