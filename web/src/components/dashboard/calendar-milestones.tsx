import { Card } from "@/components/ui/card";
import type { Milestone } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_COLOR: Record<Milestone["kind"], string> = {
  assessment: "bg-accent-strong",
  project: "bg-citation-private",
  review: "bg-orange-400",
  milestone: "bg-citation-public",
};

export function CalendarMilestones({ milestones }: { milestones: Milestone[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const activeDates = new Set(milestones.map((m) => m.date.slice(8)));

  return (
    <Card className="flex flex-col gap-6 p-6 lg:flex-row lg:gap-10">
      <div className="mx-auto shrink-0">
        <h3 className="text-sm font-semibold">
          {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <div className="mt-3 grid grid-cols-7 gap-x-0.5 gap-y-1 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span
              key={i}
              className="w-8 text-[10px] font-medium uppercase text-muted"
            >
              {d}
            </span>
          ))}
          {Array.from({ length: firstDay }, (_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = String(i + 1).padStart(2, "0");
            const isActive = activeDates.has(day);
            const isToday = i + 1 === today.getDate();
            return (
              <span
                key={day}
                className={cn(
                  "relative flex size-8 items-center justify-center rounded-full text-xs tabular-nums",
                  isToday && "font-bold text-accent",
                  !isToday && isActive && "font-semibold"
                )}
              >
                {i + 1}
                <i
                  aria-hidden
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    isActive ? "bg-accent-strong" : "bg-transparent"
                  )}
                />
              </span>
            );
          })}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold">Upcoming Milestones</h3>
        <ul className="mt-3 space-y-3">
          {milestones.slice(0, 4).map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <span
                className={cn("h-9 w-1 shrink-0 rounded-full", KIND_COLOR[m.kind])}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">{m.title}</p>
                <p className="text-[11px] text-muted">Week {m.week}</p>
              </div>
              <span className="shrink-0 rounded-full bg-tick-empty/60 px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted">
                {new Date(m.date + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </li>
          ))}
          {milestones.length === 0 && (
            <li className="text-xs text-muted">No milestones yet.</li>
          )}
        </ul>
      </div>
    </Card>
  );
}
