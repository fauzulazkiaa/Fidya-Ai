import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { ApiDocsContent } from "./page-content";

export const metadata: Metadata = buildMetadata("api_docs");

export default function ApiDocsPage() {
  return <ApiDocsContent />;
}
