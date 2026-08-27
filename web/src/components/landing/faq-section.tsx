"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

export function FaqSection() {
  const { locale } = useLocale();
  const c = getCopy("faq", locale);
  const faqs = c.items;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq-anchor" className="mx-auto w-full max-w-2xl scroll-mt-20 px-6 pb-24">
      <Reveal>
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          {c.title}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted">
          {c.subtitle}
        </p>
      </Reveal>

      {/* Minimal Supabase-style list — thin dividers, no cards */}
      <Reveal delay={120}>
        <div className="mt-10 divide-y divide-card-border border-y border-card-border">
          {faqs.map((faq, i) => {
            const open = openIdx === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="group flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span
                    className={cn(
                      "text-[15px] font-medium transition-colors",
                      open ? "text-accent" : "text-foreground group-hover:text-accent"
                    )}
                  >
                    {faq.q}
                  </span>
                  <ChevronRight
                    className={cn(
                      "size-4 shrink-0 text-muted transition-transform duration-200",
                      open && "rotate-90 text-accent"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    open ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <p className="overflow-hidden pr-8 text-sm leading-relaxed text-muted">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
