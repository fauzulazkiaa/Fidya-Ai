"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CornerDownLeft,
  Search,
} from "lucide-react";
import { useApi, type Curriculum } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  href: string;
}

const STATIC_ITEMS: PaletteItem[] = [
  { id: "nav-dash", label: "Dashboard", hint: "Go to page", href: "/dashboard" },
  { id: "nav-curr", label: "My Curriculum", hint: "Go to page", href: "/curriculum" },
  { id: "nav-tutor", label: "AI Tutor", hint: "Go to page", href: "/tutor" },
  { id: "nav-forge", label: "Forge Review", hint: "Go to page", href: "/forge" },
  { id: "nav-profile", label: "Profile", hint: "Go to page", href: "/profile" },
  { id: "nav-subscribe", label: "Subscription", hint: "Go to page", href: "/subscribe" },
  { id: "nav-settings", label: "Settings", hint: "Go to page", href: "/settings" },
  { id: "nav-help", label: "Help Center", hint: "Go to page", href: "/help" },
  { id: "act-onboard", label: "New Learning Goal", hint: "Action", href: "/onboarding" },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const api = useApi();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open)
      api
        .listCurricula()
        .then(setCurricula)
        .catch(() => setCurricula([]));
  }, [open, api]);

  const items: PaletteItem[] = useMemo(() => {
    const moduleItems: PaletteItem[] = curricula
      .flatMap((c) =>
        (c.modules ?? [])
          .filter((m) => m.status !== "locked")
          .map((m) => ({
            id: m.module_id,
            label: m.title,
            hint: `Module · ${c.target_topic} · Week ${m.week} Day ${m.day}`,
            href: `/curriculum/${m.module_id}?curriculum=${c.curriculum_id}`,
          }))
      );
    const all = [...STATIC_ITEMS, ...moduleItems];
    if (!query.trim()) return all.slice(0, 10);
    const q = query.toLowerCase();
    return all.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 10);
  }, [query, curricula]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setQuery("");
      setActiveIdx(0);
      inputRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  const select = useCallback(
    (item: PaletteItem | undefined) => {
      if (!item) return;
      onClose();
      router.push(item.href);
    },
    [onClose, router]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        select(items[activeIdx]);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [items, activeIdx, select, onClose]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[15vh]">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onKeyDown}
        className="glass-nav animate-fade-up relative w-full max-w-lg overflow-hidden rounded-3xl border border-card-border bg-card/95 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-card-border px-5">
          <Search className="size-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
            placeholder="Search pages and modules…"
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <kbd className="shrink-0 rounded-md border border-card-border px-1.5 py-0.5 text-[10px] text-muted">
            ESC
          </kbd>
        </div>

        <ul className="scrollbar-thin max-h-80 overflow-y-auto p-2">
          {items.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => select(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                  i === activeIdx ? "bg-accent-soft" : ""
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    i === activeIdx
                      ? "bg-accent text-white"
                      : "bg-tick-empty/60 text-muted"
                  )}
                >
                  {item.hint.startsWith("Module") ? (
                    <BookOpen className="size-3.5" />
                  ) : (
                    <ArrowRight className="size-3.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.label}
                  </span>
                  <span className="block text-[11px] text-muted">{item.hint}</span>
                </span>
                {i === activeIdx && (
                  <CornerDownLeft className="size-3.5 shrink-0 text-muted" />
                )}
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted">
              No results for “{query}”
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
