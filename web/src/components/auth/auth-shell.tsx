import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ForceLight } from "@/components/landing/force-light";

/**
 * Dedicated split-screen shell for /sign-in and /sign-up.
 * Left: brand story panel. Right: Clerk form. No app chrome.
 * Always renders in light mode for readability.
 */
export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]"
      style={{ marginTop: "-80px", marginBottom: "-40px" }}
    >
      <ForceLight />
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        {/* Blueprint grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 30% 40%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 30% 40%, black, transparent)",
          }}
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-24 size-[34rem] rounded-full bg-accent/25 blur-3xl"
        />

        <Link href="/" className="relative flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-sm font-extrabold">
            F
          </span>
          Fidya
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight xl:text-4xl">
            The last learning platform you&apos;ll ever abandon.
          </h2>
          <ul className="mt-8 space-y-3.5 text-sm text-white/75">
            {[
              "Curriculum engineered backwards from your deadline",
              "Every claim cited to peer-reviewed sources",
              "Socratic coaching until you can prove mastery",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-citation-public" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative max-w-md rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
          <blockquote className="text-sm leading-relaxed text-white/85">
            “I&apos;ve started maybe thirty online courses in my life. Fidya is
            the first one where I could see, week by week, that finishing was
            actually inevitable.”
          </blockquote>
          <figcaption className="mt-3 text-xs text-white/55">
            — Beta learner, Week 7 of 8
          </figcaption>
        </figure>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col border-card-border lg:border-l">
        {/* Mobile-only logo bar */}
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-extrabold text-white">
              F
            </span>
            Fidya
          </Link>
          <Link href="/" className="text-xs text-muted hover:text-foreground">
            ← Back home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-6 lg:pt-0">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-1.5 mb-8 text-sm text-muted">{subtitle}</p>
            {children}
          </div>
        </div>

        <div className="px-6 pb-8 text-center text-[11px] text-muted">
          Protected by Clerk · By continuing you agree to our{" "}
          <Link href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </Link>
        </div>
      </main>
    </div>
  );
}
