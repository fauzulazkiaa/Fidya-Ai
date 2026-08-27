"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  Flame,
  PauseCircle,
} from "lucide-react";
import { useApi, type AppNotification } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

interface Notification extends AppNotification {
  icon: typeof Bell;
  tone: string;
}

const KIND_STYLES: Record<
  string,
  { icon: typeof Bell; tone: string }
> = {
  deadline: { icon: CalendarClock, tone: "text-orange-500 bg-orange-500/10" },
  milestone: { icon: Award, tone: "text-accent bg-accent-soft" },
  done: { icon: CheckCircle2, tone: "text-citation-public bg-citation-public/10" },
  paused: { icon: PauseCircle, tone: "text-muted bg-tick-empty/40" },
  reengage: { icon: Flame, tone: "text-accent bg-accent-soft" },
};

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr + "T00:00:00").getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const api = useApi();

  useEffect(() => {
    api
      .getNotifications()
      .then(({ notifications }) =>
        setItems(
          notifications.map((n) => ({
            ...n,
            ...(KIND_STYLES[n.kind] ?? {
              icon: Flame,
              tone: "text-accent bg-accent-soft",
            }),
          }))
        )
      )
      .catch(() => setItems([]));
  }, [api]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  // "Unread" = items dated within the last 2 days (no read-state backend yet).
  const unreadCount =
    items?.filter(
      (n) =>
        !dismissed.has(n.title) &&
        (n.kind === "deadline" || n.kind === "paused" || n.kind === "reengage")
    ).length ?? 0;

  function markAllRead() {
    setDismissed(
      new Set((items ?? []).filter((n) => unreadKeys(n)).map((n) => n.title))
    );
  }

  function unreadKeys(n: Notification) {
    return n.kind === "deadline" || n.kind === "paused" || n.kind === "reengage";
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount})` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex size-9 items-center justify-center rounded-full transition-colors hover:bg-tick-empty/40",
          open ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
        )}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-card">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-nav absolute right-0 top-[calc(100%+10px)] z-[70] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-card-border bg-card/95 shadow-2xl">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold">
              Notifications
            </span>
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-tick-empty/40 hover:text-foreground"
            >
              <CheckCheck className="size-3" />
              Mark all read
            </button>
          </div>

          {/* Items */}
          <ul className="scrollbar-thin max-h-[24rem] divide-y divide-card-border overflow-y-auto">
            {(items ?? []).map((n, i) => (
              <li key={`${n.title}-${i}`}>
                <div
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3.5 text-left",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                      n.tone
                    )}
                  >
                    <n.icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold">
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[10px] tabular-nums text-muted">
                        {timeAgo(n.date)}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                      {n.desc}
                    </span>
                  </span>
                </div>
              </li>
            ))}
            {items !== null && items.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <BookOpen className="size-5 text-muted" />
                <p className="max-w-[16rem] text-xs leading-relaxed text-muted">
                  Nothing pending. Deadlines and milestones will show up here.
                </p>
              </li>
            )}
            {items === null && (
              <li className="space-y-2 p-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-2xl bg-tick-empty/40"
                  />
                ))}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
