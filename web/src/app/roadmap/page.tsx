"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronUp, CircleDashed, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

/**
 * Public roadmap + feature-request board (Canny-style).
 * Votes are stored locally per visitor and seeded with community counts —
 * swap `seedVotes` for a backend table when the volume justifies it.
 */

interface Item {
  id: string;
  title: string;
  desc: string;
  votes: number;
}

const COLUMNS: {
  key: "planned" | "progress" | "shipped";
  icon: typeof CircleDashed;
  items: Item[];
}[] = [
  {
    key: "planned",
    icon: CircleDashed,
    items: [
      {
        id: "mobile-app",
        title: "Native mobile apps",
        desc: "Offline module reading and streak reminders on iOS & Android.",
        votes: 342,
      },
      {
        id: "study-groups",
        title: "Study groups",
        desc: "Learn the same curriculum with friends; share milestones.",
        votes: 218,
      },
      {
        id: "notion-export",
        title: "Export to Notion",
        desc: "One-click export of curricula and Socratic notes to your workspace.",
        votes: 176,
      },
      {
        id: "spaced-repetition",
        title: "Spaced repetition flashcards",
        desc: "Auto-generated flashcards scheduled by forgetting-curve.",
        votes: 154,
      },
    ],
  },
  {
    key: "progress",
    icon: LoaderCircle,
    items: [
      {
        id: "mindmaps",
        title: "Concept mind maps",
        desc: "Mermaid-rendered diagrams inside synthesized lessons.",
        votes: 267,
      },
      {
        id: "voice-mode-full",
        title: "Podcast-style lesson audio",
        desc: "Full module narration so you can learn while commuting.",
        votes: 190,
      },
    ],
  },
  {
    key: "shipped",
    icon: CheckCircle2,
    items: [
      {
        id: "sessions-v2",
        title: "Tutor history v2 — sessions you control",
        desc: "Explicit conversations with pin, delete and exact grouping.",
        votes: 421,
      },
      {
        id: "focus-mode",
        title: "Focus Mode",
        desc: "One-click distraction-free reading and drilling.",
        votes: 305,
      },
      {
        id: "voice-chat",
        title: "Voice input & read-aloud in AI Tutor",
        desc: "Answer by voice; have answers read back to you.",
        votes: 288,
      },
    ],
  },
];

const VOTE_KEY = "fidya.roadmap.votes";

export default function RoadmapPage() {
  const { locale } = useLocale();
  const c = getCopy("roadmap", locale);
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [extra, setExtra] = useState<Record<string, number>>({});

  useEffect(() => {
    // Read localStorage asynchronously to avoid a synchronous setState
    // inside the effect body.
    Promise.resolve().then(() => {
      try {
        setMyVotes(JSON.parse(localStorage.getItem(VOTE_KEY) ?? "[]"));
      } catch {}
    });
  }, []);

  function upvote(id: string) {
    if (myVotes.includes(id)) return;
    const next = [...myVotes, id];
    setMyVotes(next);
    setExtra((e) => ({ ...e, [id]: (e[id] ?? 0) + 1 }));
    try {
      localStorage.setItem(VOTE_KEY, JSON.stringify(next));
    } catch {}
  }

  const columns = useMemo(
    () =>
      COLUMNS.map((col) => ({
        ...col,
        label: c.columnLabels[col.key],
        items: col.items.map((it) => {
          const copy = (c.items as Record<string, { title: string; desc: string }>)[it.id] ?? { title: it.id, desc: "" };
          return {
            ...it,
            title: copy.title,
            desc: copy.desc,
            votes: it.votes + (extra[it.id] ?? 0),
            voted: myVotes.includes(it.id),
          };
        }),
      })),
    [myVotes, extra, c]
  );

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <div className="grid gap-5 md:grid-cols-3">
        {columns.map((col) => (
          <section key={col.key} aria-label={col.label}>
            <div className="flex items-center gap-2 px-1">
              <col.icon
                className={cn(
                  "size-4",
                  col.key === "shipped"
                    ? "text-citation-public"
                    : col.key === "progress"
                      ? "animate-spin text-accent"
                      : "text-muted"
                )}
              />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted">
                {col.label}
              </h2>
              <Badge>{col.items.length}</Badge>
            </div>
            <div className="mt-3 space-y-3">
              {col.items.map((item) => (
                <Card key={item.id} className="flex gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => upvote(item.id)}
                    disabled={item.voted || col.key === "shipped"}
                    title={
                      item.voted
                        ? c.votedTooltip
                        : col.key === "shipped"
                          ? c.shippedTooltip
                          : c.upvote
                    }
                    className={cn(
                      "flex h-fit shrink-0 flex-col items-center rounded-xl border px-2.5 py-1.5 transition-colors",
                      item.voted
                        ? "border-accent bg-accent text-white"
                        : "border-card-border text-muted hover:border-accent/50 hover:text-accent",
                      col.key === "shipped" && !item.voted && "opacity-60"
                    )}
                  >
                    <ChevronUp className="size-3.5" />
                    <span className="text-[11px] font-bold tabular-nums">
                      {item.votes}
                    </span>
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-semibold leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">
                      {item.desc}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Card className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold">{c.ideaTitle}</p>
          <p className="text-xs text-muted">{c.ideaLead}</p>
        </div>
        <Link
          href="/contact"
          className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110"
        >
          {c.requestFeature}
        </Link>
      </Card>
    </PageShell>
  );
}
