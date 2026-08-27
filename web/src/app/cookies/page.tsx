import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { CookiesContent } from "./page-content";

export const metadata: Metadata = buildMetadata("cookies");

export default function CookiesPage() {
  return <CookiesContent />;
}
