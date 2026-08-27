import { Card } from "@/components/ui/card";
import type { ActivityDay } from "@/lib/types";

export function ActivityChart({
  data,
  subtitle = "This week · hours/day",
}: {
  data: ActivityDay[];
  subtitle?: string;
}) {
  const max = Math.max(
    ...data.map((d) => d.hours ?? (d.lessons_hours ?? 0) + (d.practice_hours ?? 0)),
    1
  );
  return (
    <Card className="w-full p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Learning Velocity</h3>
        <span className="text-xs text-muted">{subtitle}</span>
      </div>

      <div className="mt-5 flex h-40 items-end gap-2 sm:gap-3">
        {data.map((d, i) => {
          const total = d.hours ?? (d.lessons_hours ?? 0) + (d.practice_hours ?? 0);
          const lessonsPct = total ? ((d.lessons_hours ?? 0) / total) * 100 : 0;
          const practicePct = total ? 100 - lessonsPct : 0;
          const barPct = (total / max) * 100;
          return (
            <div
              key={d.date || `${d.label}-${i}`}
              title={`${d.label}: ${total.toFixed(1)}h`}
              className="flex h-full min-w-0 flex-1 flex-col items-center gap-2"
            >
              <span className="text-[10px] font-medium tabular-nums text-muted">
                {total > 0 ? `${total.toFixed(1)}h` : ""}
              </span>
              <div className="flex w-full max-w-11 flex-1 items-end">
                <div
                  className="flex w-full flex-col-reverse overflow-hidden rounded-full border border-card-border transition-[height] duration-500"
                  style={{ height: `${barPct}%` }}
                >
                  <div
                    className="bg-accent-strong"
                    style={{ height: `${lessonsPct}%` }}
                  />
                  <div
                    className="bg-citation-private"
                    style={{ height: `${practicePct}%` }}
                  />
                </div>
              </div>
              <span className="text-[11px] font-medium text-muted">{d.label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-card-border pt-3 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-accent-strong not-italic" /> Lessons
        </span>
        <span className="flex items-center gap-1.5">
          <i className="size-2 rounded-full bg-citation-private not-italic" />{" "}
          Practice / Forge
        </span>
      </div>
    </Card>
  );
}
