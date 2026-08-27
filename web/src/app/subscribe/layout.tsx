import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";

export const metadata: Metadata = buildMetadata("subscribe");

export default function subscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
