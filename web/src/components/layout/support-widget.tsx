"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HelpCircle, Mail, Map, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isPublicRoute } from "@/lib/public-routes";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

/**
 * Floating support widget (Intercom-style) — bottom-right on every page.
 * Gives learners a permanent escape hatch without a third-party script.
 */
export function SupportWidget() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const c = getCopy("support_widget", locale);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Hidden on public marketing/legal routes (they are not app surfaces)
  // and during auth flows. Computed before any early return so hook
  // order stays stable.
  const hidden = isPublicRoute(pathname);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (hidden) return null;

  return (
    <div className="app-chrome fixed bottom-5 right-5 z-[80]" ref={panelRef}>
      {open && (
        <div className="animate-toast-in mb-3 w-72 overflow-hidden rounded-3xl border border-card-border bg-card shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
          <div className="flex items-center justify-between bg-accent px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">{c.panelTitle}</p>
              <p className="text-[11px] text-white/75">
                {c.panelSubtitle}
              </p>
            </div>
            <button
              type="button"
              aria-label={c.closePanel}
              onClick={() => setOpen(false)}
              className="flex size-7 items-center justify-center rounded-full transition-colors hover:bg-white/15"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="p-2">
            {[
              {
                icon: MessageCircle,
                label: c.chatLabel,
                desc: c.chatDesc,
                href: "mailto:support@fidya.ai?subject=Support%20request",
                external: true,
              },
              {
                icon: HelpCircle,
                label: c.helpLabel,
                desc: c.helpDesc,
                href: "/help",
              },
              {
                icon: Map,
                label: c.roadmapLabel,
                desc: c.roadmapDesc,
                href: "/roadmap",
              },
            ].map((item) => {
              const inner = (
                <>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <item.icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">
                      {item.label}
                    </span>
                    <span className="block truncate text-[11px] text-muted">
                      {item.desc}
                    </span>
                  </span>
                </>
              );
              return item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-tick-empty/40"
                  )}
                >
                  {inner}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-tick-empty/40"
                >
                  {inner}
                </Link>
              );
            })}
            <a
              href="mailto:hello@fidya.ai"
              className="mt-1 flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-card-border p-2.5 text-[11px] font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent"
            >
              <Mail className="size-3.5" /> hello@fidya.ai
            </a>
          </div>
        </div>
      )}
      <button
        type="button"
        aria-label={c.openSupport}
        title={c.support}
        onClick={() => setOpen((o) => !o)}
        className="ml-auto flex size-12 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_24px_rgba(79,70,229,0.4)] transition-all hover:scale-105 hover:brightness-110 active:scale-95"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </div>
  );
}
