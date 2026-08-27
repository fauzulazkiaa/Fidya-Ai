"use client";

import Image from "next/image";
import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

/**
 * Testimonials wall in the vein of arena.ai's marketing site:
 * a quiet, editorial header followed by slow vertical marquee
 * columns of short learner quotes. Pure CSS motion — no deps.
 */

interface Quote {
  text: string;
  name: string;
  role: string;
  avatar?: string;
  result?: string;
}

const AVATARS: Record<string, string> = {
  "Raka P.": "/avatars/raka.jpg",
  "Sarah K.": "/avatars/sarah.jpg",
  "Dimas A.": "/avatars/dimas.jpg",
  "Wei L.": "/avatars/wei.jpg",
  "Amira S.": "/avatars/amira.jpg",
  "Budi H.": "/avatars/budi.jpg",
  "Nadia F.": "/avatars/nadia.jpg",
  "Jonathan T.": "/avatars/jonathan.jpg",
};

function Card({ q }: { q: Quote }) {
  return (
    <figure className="rounded-3xl border border-card-border bg-card p-5">
      {q.result && (
        <p className="mb-3 inline-flex rounded-full bg-accent-soft px-2.5 py-1 text-[10px] font-bold text-accent">
          {q.result}
        </p>
      )}
      <blockquote className="text-[13px] leading-relaxed text-foreground/90">
        &ldquo;{q.text}&rdquo;
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-2.5">
        {q.avatar ? (
          <Image
            src={q.avatar}
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-full ring-1 ring-card-border"
          />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-strong text-[11px] font-bold text-white">
            {q.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{q.name}</p>
          <p className="truncate text-[11px] text-muted">{q.role}</p>
        </div>
      </figcaption>
    </figure>
  );
}

function Column({
  items,
  direction,
  duration,
}: {
  items: Quote[];
  direction: "up" | "down";
  duration: number;
}) {
  return (
    <div className="testimonials-mask group h-[26rem] overflow-hidden md:h-[30rem]">
      <div
        className={
          direction === "up"
            ? "animate-marquee-up group-hover:[animation-play-state:paused]"
            : "animate-marquee-down group-hover:[animation-play-state:paused]"
        }
        style={{ animationDuration: `${duration}s` }}
      >
        {/* Duplicated list creates the seamless loop */}
        {[...items, ...items].map((q, i) => (
          <div key={`${q.name}-${i}`} className="pb-4">
            <Card q={q} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  const { locale } = useLocale();
  const c = getCopy("testimonials", locale);
  const cols = useMemo(() => {
    const quotes: Quote[] = c.items.map((q: Omit<Quote, "avatar">) => ({
      ...q,
      avatar: AVATARS[q.name],
    }));
    const a = quotes.filter((_, i) => i % 3 === 0);
    const b = quotes.filter((_, i) => i % 3 === 1);
    const d = quotes.filter((_, i) => i % 3 === 2);
    return [a, b, d];
  }, [c.items]);

  return (
    <section id="testimonials" className="border-t border-card-border/70">
      <div className="mx-auto w-full max-w-5xl scroll-mt-20 px-6 py-16 sm:py-24">
        <p className="animate-fade-up text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          {c.eyebrow}
        </p>
        <h2 className="animate-fade-up mt-3 text-center text-2xl font-bold tracking-tight sm:text-3xl">
          {c.title}
        </h2>
        <p className="mx-auto mt-2 max-w-md animate-fade-up text-center text-sm text-muted">
          {c.subtitle}
        </p>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
          <ShieldCheck className="size-3.5 shrink-0 text-citation-public" />
          {c.proofLine}
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Column items={cols[0]} direction="up" duration={46} />
          <Column items={cols[1]} direction="down" duration={58} />
          {/* Third column only on wide screens */}
          <div className="hidden lg:block">
            <Column items={cols[2]} direction="up" duration={52} />
          </div>
        </div>
      </div>
    </section>
  );
}
