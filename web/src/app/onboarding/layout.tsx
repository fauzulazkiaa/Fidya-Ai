import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Learning Goal" };

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
