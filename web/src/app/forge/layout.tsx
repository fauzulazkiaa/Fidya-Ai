import type { Metadata } from "next";

export const metadata: Metadata = { title: "Forge Review" };

export default function forgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
