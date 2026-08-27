import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { SelfTaughtDevsContent } from "./page-content";

export const metadata: Metadata = buildMetadata("solutions_self_taught_devs");

export default function SelfTaughtDevsPage() {
  return <SelfTaughtDevsContent />;
}
