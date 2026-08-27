import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo-copy";
import { BlogContent } from "./page-content";

export const metadata: Metadata = buildMetadata("blog");

export default function BlogPage() {
  return <BlogContent />;
}
