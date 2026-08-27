import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { StudentsContent } from "./page-content";

export const metadata: Metadata = buildMetadata("solutions_students");

export default function StudentsPage() {
  return <StudentsContent />;
}
