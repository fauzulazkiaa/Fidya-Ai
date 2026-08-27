import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { BootcampsContent } from "./page-content";

export const metadata: Metadata = buildMetadata("solutions_bootcamps");

export default function BootcampsPage() {
  return <BootcampsContent />;
}
