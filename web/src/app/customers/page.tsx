import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { CustomersContent } from "./page-content";

export const metadata: Metadata = buildMetadata("customers");

export default function CustomersPage() {
  return <CustomersContent />;
}
