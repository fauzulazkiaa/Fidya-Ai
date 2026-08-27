import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { BusinessContent } from "./page-content";

export const metadata: Metadata = buildMetadata("business");

export default function BusinessPage() {
  return <BusinessContent />;
}
