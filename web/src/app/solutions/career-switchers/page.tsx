import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { CareerSwitchersContent } from "./page-content";

export const metadata: Metadata = buildMetadata("solutions_career_switchers");

export default function CareerSwitchersPage() {
  return <CareerSwitchersContent />;
}
