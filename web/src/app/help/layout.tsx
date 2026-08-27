import type { Metadata } from "next";

export const metadata: Metadata = { title: "Help Center" };

export default function helpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
