import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { SecurityContent } from "./page-content";

export const metadata: Metadata = buildMetadata("security");

export default function SecurityPage() {
  return <SecurityContent />;
}
