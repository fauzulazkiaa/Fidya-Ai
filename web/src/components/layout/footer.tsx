"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/providers/locale-provider";
import { isPublicRoute } from "@/lib/public-routes";
import { getCopy } from "@/lib/seo-copy";

export function Footer() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const c = getCopy("app_footer", locale);

  // Public routes render their own chrome (landing footer / PageShell).
  if (isPublicRoute(pathname)) return null;

  return (
    <footer className="app-chrome border-t border-card-border py-6 text-center text-[11px] text-muted">
      {c.copyright} ·{" "}
      <Link href="/help" className="underline-offset-2 hover:underline">
        {c.help}
      </Link>{" "}
      ·{" "}
      <Link href="/subscribe" className="underline-offset-2 hover:underline">
        {c.pricing}
      </Link>{" "}
      ·{" "}
      <Link href="/roadmap" className="underline-offset-2 hover:underline">
        {c.roadmap}
      </Link>
    </footer>
  );
}
