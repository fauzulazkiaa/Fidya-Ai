import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { StatusContent } from "./page-content";

export const metadata: Metadata = buildMetadata("status");

export default function StatusPage() {
  return <StatusContent />;
}
