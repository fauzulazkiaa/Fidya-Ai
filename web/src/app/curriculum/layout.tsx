import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Curriculum" };

export default function curriculumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
