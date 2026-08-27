"use client";

/**
 * Lightweight guided product tour (a mini driver.js).
 * Shows once, on first dashboard visit: spotlights key UI regions and
 * explains them in 4 short steps. Progress is stored in localStorage.
 */

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DONE_KEY = "fidya.tour.done";

interface Step {
  selector: string;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    selector: '[data-tour="welcome"]',
    title: "Selamat datang di dashboard kamu 👋",
    desc: "Setiap hari Fidya menyambutmu dengan sapaan, kutipan baru, dan tombol lanjutkan — supaya kamu selalu tahu harus mulai dari mana.",
  },
  {
    selector: '[data-tour="continue"]',
    title: "Lanjutkan dari tempat kamu berhenti",
    desc: "Satu klik membawamu kembali ke modul yang sedang kamu pelajari. Tidak perlu mencari-cari.",
  },
  {
    selector: '[data-tour="progress"]',
    title: "Kurikulum & progres dalam satu pandangan",
    desc: "Ganti antar kurikulum, jeda saat hidup sedang sibuk, atau lihat streak belajarmu.",
  },
  {
    selector: '[data-tour="modules"]',
    title: "Modul minggu ini",
    desc: "Buka modul untuk membaca pelajaran yang sudah diverifikasi, lalu uji dirimu bersama The Inquisitor. Selamat belajar! 🎉",
  },
];

export function ProductTour() {
  const [stepIndex, setStepIndex] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    let done = false;
    try {
      done = localStorage.getItem(DONE_KEY) === "1";
    } catch {}
    if (!done) {
      const t = setTimeout(() => setStepIndex(0), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const measure = useCallback(
    (sel: string): Promise<DOMRect | null> => {
      const el = document.querySelector(sel);
      if (!el) return Promise.resolve(null);
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      return new Promise<DOMRect | null>((resolve) =>
        setTimeout(() => resolve(el.getBoundingClientRect()), 350)
      );
    },
    []
  );

  useEffect(() => {
    if (stepIndex === null) return;
    const step = STEPS[stepIndex];
    if (!step) return;
    let raf = requestAnimationFrame(() => {
      void measure(step.selector).then(setRect);
    });
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        void measure(step.selector).then(setRect);
      });
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [stepIndex, measure]);

  function finish() {
    setStepIndex(null);
    try {
      localStorage.setItem(DONE_KEY, "1");
    } catch {}
  }

  if (stepIndex === null) return null;
  const step = STEPS[stepIndex];
  const pad = 8;

  // Tooltip placement: prefer below the target, flip above when cramped.
  const tipBelow = rect ? rect.bottom + 14 < window.innerHeight - 220 : true;
  const tipStyle = rect
    ? tipBelow
      ? { top: rect.bottom + pad + 6, left: Math.max(rect.left, 16) }
      : {
          top: Math.max(16, rect.top - 216),
          left: Math.max(Math.min(rect.left, window.innerWidth - 360), 16),
        }
    : undefined;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Spotlight cut-out */}
      {rect && (
        <div
          className="absolute rounded-2xl transition-all duration-300"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.62)",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Click-away backdrop */}
      <div className="absolute inset-0 cursor-pointer" onClick={finish} />

      {/* Tooltip card */}
      {tipStyle && (
        <div
          role="dialog"
          aria-label={step.title}
          className="animate-toast-in absolute w-[340px] max-w-[calc(100vw-32px)] rounded-3xl border border-card-border bg-card p-5 shadow-[0_24px_70px_rgba(15,23,42,0.35)]"
          style={tipStyle}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-bold leading-snug">{step.title}</h3>
            <button
              type="button"
              onClick={finish}
              aria-label="Skip tour"
              className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-tick-empty/50 hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">{step.desc}</p>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={
                    i === stepIndex
                      ? "h-1.5 w-5 rounded-full bg-accent"
                      : "size-1.5 rounded-full bg-tick-empty"
                  }
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setStepIndex((i) => (i ?? 1) - 1)}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={() => (stepIndex === STEPS.length - 1 ? finish() : setStepIndex(stepIndex + 1))}>
                {stepIndex === STEPS.length - 1 ? (
                  "Selesai"
                ) : (
                  <>
                    Lanjut <ArrowRight className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
