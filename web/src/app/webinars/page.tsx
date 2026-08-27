import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { WebinarsContent } from "./page-content";

export const metadata: Metadata = buildMetadata("webinars");

export default function WebinarsPage() {
  return <WebinarsContent />;
}
