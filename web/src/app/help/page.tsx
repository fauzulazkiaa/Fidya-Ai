"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

export default function HelpPage() {
  const { locale } = useLocale();
  const c = getCopy("help", locale);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6">
      <header className="animate-fade-up text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent text-white">
          <LifeBuoy className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{c.title}</h1>
        <p className="mt-1 text-sm text-muted">{c.subtitle}</p>
      </header>

      {/* Contact cards */}
      <section className="grid animate-fade-up gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-3 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <MessageCircle className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{c.chatSupport}</p>
            <p className="text-xs text-muted">{c.chatHours}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-citation-private/10 text-citation-private">
            <Mail className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">support@fidya.ai</p>
            <p className="text-xs text-muted">{c.repliesWithin}</p>
          </div>
        </Card>
      </section>

      {/* FAQ */}
      <section className="animate-fade-up">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <BookOpen className="size-4 text-accent" /> {c.faqHeading}
        </h2>
        <div className="space-y-2.5">
          {c.faqs.map((faq, i) => {
            const open = openIdx === i;
            return (
              <Card key={i} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <span className="text-sm font-medium">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted transition-transform duration-200",
                      open && "rotate-180"
                    )}
                  />
                </button>
                {open && (
                  <p className="animate-fade-up border-t border-card-border px-5 py-4 text-[13px] leading-relaxed text-muted">
                    {faq.a}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <Card className="animate-fade-up flex flex-col items-center justify-between gap-3 p-6 sm:flex-row">
        <div>
          <p className="text-sm font-semibold">{c.stillStuck}</p>
          <p className="text-xs text-muted">{c.askInquisitor}</p>
        </div>
        <Badge tone="accent">{c.avgResolution}</Badge>
      </Card>
    </div>
  );
}
