import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { SolutionsContent } from "./page-content";

export const metadata: Metadata = buildMetadata("solutions");

export default function SolutionsPage() {
  return <SolutionsContent />;
}
