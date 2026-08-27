import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Eye-catching badge for Pro subscribers — uses the app's own accent palette. */
export function ProBadge({
  plan,
  className,
  compact = false,
}: {
  plan: string;
  className?: string;
  compact?: boolean;
}) {
  if (plan !== "pro" && plan !== "team") return null;
  const isTeam = plan === "team";
  return (
    <span
      title={isTeam ? "Team plan" : "Pro Learner — unlimited curricula & priority agents"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-accent to-accent-strong font-bold uppercase tracking-wide text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)]",
        compact ? "px-1.5 py-0.5 text-[8px]" : "px-2.5 py-0.5 text-[10px]",
        className
      )}
    >
      <Crown className={compact ? "size-2.5" : "size-3"} />
      {isTeam ? "Team" : "Pro"}
    </span>
  );
}
