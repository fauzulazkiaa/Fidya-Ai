/**
 * Plan resolution shared by navbar, profile & settings.
 *
 * A paid plan reported by the backend is authoritative and gets cached;
 * otherwise the locally-selected plan (Subscribe page) wins. This keeps
 * badges correct even before the `users.plan` column is migrated in,
 * where the backend would always answer "free".
 */
export function resolvePlan(serverPlan: string | null | undefined): string {
  let local = "";
  try {
    local = localStorage.getItem("fidya.plan") || "";
  } catch {
    /* noop */
  }
  if (serverPlan && serverPlan !== "free") {
    try {
      localStorage.setItem("fidya.plan", serverPlan);
    } catch {
      /* noop */
    }
    return serverPlan;
  }
  return local || "free";
}

export function readLocalPlan(): string {
  try {
    return localStorage.getItem("fidya.plan") || "free";
  } catch {
    return "free";
  }
}

export const PLAN_LABELS: Record<string, string> = {
  free: "Starter",
  pro: "Pro Learner",
  team: "Team",
};

export function isPro(plan: string): boolean {
  return plan === "pro" || plan === "team";
}
