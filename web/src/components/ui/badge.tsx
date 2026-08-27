import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "accent" | "public" | "private" | "destructive";
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
        {
          neutral: "bg-tick-empty/60 text-muted",
          accent: "bg-accent-soft text-accent",
          public: "bg-citation-public/10 text-citation-public",
          private: "bg-citation-private/10 text-citation-private",
          destructive: "bg-red-500/10 text-red-500",
        }[tone],
        className
      )}
      {...props}
    />
  );
}

export function CitationBadge({
  index,
  kind,
}: {
  index: number;
  kind: "public" | "private";
}) {
  const color = kind === "public" ? "citation-public" : "citation-private";
  return (
    <span
      className={cn(
        "mx-0.5 inline-flex size-5 items-center justify-center align-super rounded-md text-[10px] font-semibold"
      )}
      style={{
        color: `var(--${color})`,
        backgroundColor: `color-mix(in srgb, var(--${color}) 12%, transparent)`,
      }}
    >
      [{index}]
    </span>
  );
}
