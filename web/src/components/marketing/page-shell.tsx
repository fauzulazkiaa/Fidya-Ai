"use client";

import { Reveal } from "@/components/landing/reveal";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

/**
 * Consistent shell for public marketing/company pages so every footer
 * destination looks like it belongs to the same product.
 */
export function PageShell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
}) {
  const { locale } = useLocale();
  const c = getCopy("page_shell", locale);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="animate-fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {lead && (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
            {lead}
          </p>
        )}
      </header>
      <div className="mt-10 space-y-8">{children}</div>
      <footer className="mt-16 border-t border-card-border pt-6 text-[11px] text-muted">
        {c.footer}
      </footer>
    </div>
  );
}

export { Reveal };
