"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useLocale } from "@/components/providers/locale-provider";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { getCopy } from "@/lib/seo-copy";
import {
  BLOG_POSTS,
  type BlogAuthorKey,
  type BlogCat,
} from "@/lib/blog-data";

type CatKey = BlogCat;

const AUTHORS: Record<BlogAuthorKey, string> = {
  fauzul: "Fauzul Azkia",
  clara: "Clara Wibowo",
  arif: "Dr. Arif Hidayat",
  maya: "Maya Gunawan",
  siti: "Siti Prameswari",
  jonathan: "Jonathan Oey",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter((w) => w && !w.endsWith("."))
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function BlogContent() {
  const api = useApi();
  const { locale } = useLocale();
  const c = getCopy("blog", locale);
  const months = c.months as string[];
  const { toast } = useToast();

  const [activeCat, setActiveCat] = useState<"all" | CatKey>("all");
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");

  const posts = BLOG_POSTS.map((m) => ({
    ...m,
    title: m.title[locale],
    excerpt: m.excerpt[locale],
  }));
  const featured = posts[0];
  const showFeatured = activeCat === "all" || featured.cat === activeCat;
  const rest = activeCat === "all" ? posts.slice(1) : posts.filter(
    (p) => p.cat === activeCat
  );
  const withThumbs = activeCat === "all" ? rest.slice(0, 2) : [];
  const tiles = activeCat === "all" ? rest.slice(2) : rest;

  function dateLine(p: (typeof posts)[number]) {
    return `${c.publishedLabel} ${p.day} ${months[p.month]} ${p.year}`;
  }

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || subState === "loading") return;
    setSubState("loading");
    try {
      await api.subscribeNewsletter(email, "blog");
      setSubState("done");
      setEmail("");
      toast({
        tone: "success",
        title: c.toastSuccessTitle,
        desc: c.toastSuccessDesc,
      });
      setTimeout(() => setSubState("idle"), 6000);
    } catch {
      setSubState("error");
      toast({
        tone: "warning",
        title: c.toastErrorTitle,
        desc: c.toastErrorDesc,
      });
      setTimeout(() => setSubState("idle"), 5000);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {c.heading}
        </h1>
      </header>

      {/* Category tabs */}
      <nav
        aria-label="Categories"
        className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-1 border-y border-card-border py-2.5"
      >
        {[{ key: "all" as const, label: c.filterAll }, ...c.categories].map(
          (tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCat(tab.key as "all" | CatKey)}
              className={cn(
                "relative px-1 py-1.5 text-xs font-medium transition-colors",
                activeCat === tab.key
                  ? "text-foreground after:absolute after:inset-x-0 after:-bottom-[11px] after:h-0.5 after:bg-accent"
                  : "text-muted hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          )
        )}
      </nav>

      {/* Featured post */}
      {showFeatured && (
        <article className="group mt-8 cursor-pointer overflow-hidden rounded-xl border border-card-border bg-card shadow-sm transition-all duration-300 hover:border-accent/50">
          <div className="relative aspect-[16/7] w-full overflow-hidden bg-tick-empty sm:aspect-[21/8]">
            <Image
              src={featured.img!}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1.5">
                {featured.authors.map((a) => (
                  <span
                    key={a}
                    className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-[9px] font-bold text-accent ring-2 ring-card"
                  >
                    {initials(AUTHORS[a])}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted">
                {dateLine(featured)} · {featured.readTime}{" "}
                {c.readTimeSuffix}
              </p>
            </div>
            <h2 className="mt-3 text-xl font-bold leading-snug tracking-tight transition-colors group-hover:text-accent sm:text-2xl">
              {featured.title}
            </h2>
            <p className="mt-2.5 line-clamp-2 max-w-3xl text-sm leading-relaxed text-muted">
              {featured.excerpt}
            </p>
          </div>
        </article>
      )}

      {/* Secondary cards with thumbnails */}
      {withThumbs.length > 0 && (
        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          {withThumbs.map((post) => (
            <article
              key={post.title}
              className="group cursor-pointer overflow-hidden rounded-xl border border-card-border bg-card shadow-sm transition-all duration-300 hover:border-accent/50"
            >
              <div className="relative h-36 overflow-hidden bg-tick-empty sm:h-44">
                <Image
                  src={post.img!}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <h3 className="text-sm font-bold leading-snug transition-colors group-hover:text-accent">
                  {post.title}
                </h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex -space-x-1.5">
                    {post.authors.map((a) => (
                      <span
                        key={a}
                        className="flex size-6 items-center justify-center rounded-full bg-tick-empty/60 text-[8px] font-bold text-foreground ring-2 ring-card"
                      >
                        {initials(AUTHORS[a])}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted">
                    {post.day} {months[post.month]} {post.year} ·{" "}
                    {post.readTime} {c.readTimeSuffix}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Compact post grid */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((post) => (
          <article
            key={post.title}
            className="group flex min-h-36 cursor-pointer flex-col justify-between rounded-xl border border-card-border bg-card p-4 transition-all duration-200 hover:border-accent/60 hover:shadow-sm"
          >
            <h3 className="text-[13px] font-medium leading-snug transition-colors group-hover:text-accent">
              {post.title}
            </h3>
            <div className="pt-5">
              <div className="flex -space-x-1.5">
                {post.authors.map((a) => (
                  <span
                    key={a}
                    className="flex size-6 items-center justify-center rounded-full bg-tick-empty/60 text-[8px] font-bold text-foreground ring-2 ring-card"
                  >
                    {initials(AUTHORS[a])}
                  </span>
                ))}
              </div>
              <p className="mt-2.5 text-[11px] text-muted">
                <span className="lowercase">{post.cat}</span> ·{" "}
                {post.day} {months[post.month].toLowerCase()}{" "}
                {post.year}
              </p>
            </div>
          </article>
        ))}
      </section>

      {/* Trust band */}
      <section className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-card-border bg-card/40 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold">
          <ShieldCheck className="size-4 text-citation-public" />
          {c.trustLine}
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted">
          {c.trustBadges.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>

      {/* Newsletter */}
      <section className="mt-6 rounded-2xl border border-card-border bg-card px-6 py-6">
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="max-w-md">
            <p className="flex items-center gap-2 text-xs font-semibold">
              <Mail className="size-4 text-accent" />
              Newsletter
            </p>
            <p className="mt-1.5 text-sm text-muted">{c.newsletterTitle}</p>
          </div>
          <form onSubmit={subscribe} className="flex w-full gap-2 lg:w-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (subState !== "loading") setSubState("idle");
              }}
              placeholder={c.emailPlaceholder}
              aria-label={c.emailPlaceholder}
              className="h-10 w-full flex-1 rounded-full border border-card-border bg-background px-4 text-xs outline-none transition-colors placeholder:text-muted focus:border-accent lg:w-64"
            />
            <button
              type="submit"
              disabled={subState === "loading"}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-accent px-5 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(79,70,229,0.3)] transition-all hover:brightness-110 disabled:opacity-80"
            >
              {subState === "idle" && c.subscribe}
              {subState === "loading" && (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> {c.sending}
                </>
              )}
              {subState === "done" && (
                <>
                  <Check className="size-3.5" /> {c.subscribed}
                </>
              )}
              {subState === "error" && c.subscribe}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
