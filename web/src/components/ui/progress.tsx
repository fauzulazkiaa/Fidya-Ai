import { cn } from "@/lib/utils";

export function TickProgress({
  value,
  ticks = 24,
  className,
  animated = false,
}: {
  value: number;
  ticks?: number;
  className?: string;
  animated?: boolean;
}) {
  const filled = Math.round((value / 100) * ticks);
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${value}% complete`}
      className={cn("flex w-full items-center gap-[3px]", className)}
    >
      {Array.from({ length: ticks }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-3 flex-1 rounded-[2px] transition-colors duration-300",
            i < filled ? "bg-accent-strong" : "bg-tick-empty",
            animated && i < filled && "animate-tick-pop"
          )}
          style={
            animated && i < filled ? { animationDelay: `${i * 45}ms` } : undefined
          }
        />
      ))}
    </div>
  );
}

export function SegmentedBar({
  segments,
}: {
  segments: { label: string; color: string; pct: number }[];
}) {
  return (
    <div
      className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full"
      aria-hidden
    >
      {segments.map((s) => (
        <div
          key={s.label}
          title={`${s.label}: ${s.pct}%`}
          className="rounded-full"
          style={{ width: `${s.pct}%`, backgroundColor: s.color }}
        />
      ))}
    </div>
  );
}
