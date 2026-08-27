"use client";

import { Fragment } from "react";
import { BookOpen, FileText } from "lucide-react";
import { CitationBadge } from "@/components/ui/badge";
import type { Citation } from "@/lib/types";
import { cn } from "@/lib/utils";

function CitationTooltip({ citation }: { citation: Citation }) {
  return (
    <span
      role="tooltip"
      className="glass-nav pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-64 max-w-[85vw] -translate-x-1/2 rounded-2xl border border-card-border bg-card/90 p-4 text-left opacity-0 shadow-xl transition-opacity duration-150 group-hover/cite:opacity-100"
    >
      <span className="flex items-start gap-2">
        {citation.kind === "public" ? (
          <BookOpen className="mt-0.5 size-3.5 shrink-0 text-citation-public" />
        ) : (
          <FileText className="mt-0.5 size-3.5 shrink-0 text-citation-private" />
        )}
        <span>
          <span className="block text-xs font-semibold leading-snug">
            {citation.source_title}
          </span>
          <span className="mt-0.5 block text-[10px] text-muted">
            {citation.author}
            {citation.published_at ? ` · ${citation.published_at}` : ""}
          </span>
        </span>
      </span>
      <span className="mt-2 block rounded-xl bg-background p-2.5 text-[11px] italic leading-relaxed text-muted">
        “{citation.snippet}”
      </span>
      <span
        className={cn(
          "mt-2 inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
        )}
        style={{
          color: `var(--${
            citation.kind === "public" ? "citation-public" : "citation-private"
          })`,
          backgroundColor: `color-mix(in srgb, var(--${
            citation.kind === "public" ? "citation-public" : "citation-private"
          }) 12%, transparent)`,
        }}
      >
        Verified · {citation.kind === "public" ? "Academic" : "Private doc"}
      </span>
    </span>
  );
}

export function CitationText({
  text,
  citations,
}: {
  text: string;
  citations: Citation[];
}) {
  const byId = new Map(citations.map((c) => [c.chunk_id, c]));
  const parts = text.split(/(\[[a-z0-9_]+_p\d+\])/g);

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[([a-z0-9_]+_p\d+)\]$/);
        if (!match) {
          return (
            <Fragment key={i}>
              {part.split("\n\n").map((para, j, arr) => (
                <Fragment key={j}>
                  {para}
                  {j < arr.length - 1 && (
                    <>
                    {"\n"}
                    {"\n"}
                    </>
                  )}
                </Fragment>
              ))}
            </Fragment>
          );
        }
        const citation = byId.get(match[1]);
        if (!citation) return null;
        return (
          <span key={i} className="group/cite relative inline-block">
            <a
              href={citation.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (citation.source_url === "#") e.preventDefault();
              }}
              aria-label={`Source: ${citation.source_title}`}
            >
              <CitationBadge index={citation.index} kind={citation.kind} />
            </a>
            <CitationTooltip citation={citation} />
          </span>
        );
      })}
    </>
  );
}

export function SourcesDrawer({
  open,
  onClose,
  citations,
}: {
  open: boolean;
  onClose: () => void;
  citations: Citation[];
}) {
  return (
    <>
      {open && (
        <div
          aria-hidden
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        />
      )}
      <aside
        aria-label="Sources"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-card-border bg-card shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-card-border p-5">
          <h3 className="text-sm font-semibold">
            Sources ({citations.length})
          </h3>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-xs text-muted hover:bg-tick-empty/50"
          >
            Close
          </button>
        </div>
        <ul className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-5">
          {citations.map((c) => (
            <li key={c.chunk_id}>
              <a
                href={c.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (c.source_url === "#") e.preventDefault();
                }}
                className="block rounded-2xl border border-card-border p-4 transition-colors hover:bg-accent-soft"
              >
                <span className="flex items-start gap-2.5">
                  <CitationBadge index={c.index} kind={c.kind} />
                  <span>
                    <span className="block text-[13px] font-medium leading-snug">
                      {c.source_title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {c.author}
                      {c.published_at ? ` · ${c.published_at}` : ""}
                    </span>
                  </span>
                </span>
                <span className="mt-2 block rounded-xl bg-background p-2.5 text-[11px] italic leading-relaxed text-muted">
                  “{c.snippet}”
                </span>
              </a>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
