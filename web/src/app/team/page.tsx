import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { TeamContent } from "./page-content";

export const metadata: Metadata = buildMetadata("team");

export default function TeamPage() {
  return <TeamContent />;
}
