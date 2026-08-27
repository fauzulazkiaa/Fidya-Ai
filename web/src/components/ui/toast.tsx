"use client";

/**
 * Lightweight toast system (no external deps).
 * Usage:
 *   const { toast } = useToast();
 *   toast({ title: "Welcome back!", desc: "…" , tone: "success" });
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "warning" | "accent";

interface ToastItem {
  id: number;
  title: string;
  desc?: string;
  tone: Tone;
}

interface ToastOptions {
  title: string;
  desc?: string;
  tone?: Tone;
  /** ms before auto-dismiss (default 4500) */
  duration?: number;
}

const ToastContext = createContext<{ toast: (o: ToastOptions) => void }>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const TONE_STYLE: Record<Tone, string> = {
  success: "text-citation-public",
  info: "text-accent-strong",
  warning: "text-orange-500",
  accent: "text-accent",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (o: ToastOptions) => {
      const id = nextId.current++;
      setItems((list) => [
        // Cap the stack so it never floods the screen.
        ...list.slice(-2),
        { id, title: o.title, desc: o.desc, tone: o.tone ?? "info" },
      ]);
      setTimeout(() => dismiss(id), o.duration ?? 4500);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Top-center stack — visible, but never blocks navigation */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-20 z-[90] flex flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-toast-in pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-card-border bg-card/95 p-3.5 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur"
          >
            <span className={cn("mt-0.5 shrink-0", TONE_STYLE[t.tone])}>
              {t.tone === "success" ? (
                <CheckCircle2 className="size-5" />
              ) : t.tone === "warning" ? (
                <AlertTriangle className="size-5" />
              ) : t.tone === "accent" ? (
                <Sparkles className="size-5" />
              ) : (
                <Info className="size-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-snug">{t.title}</p>
              {t.desc && (
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {t.desc}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-tick-empty/50 hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
