import { redirect } from "next/navigation";

// Analytics was merged into the Dashboard (velocity chart + conceptual
// mastery live there now). This route is kept for old links/bookmarks.
export default function AnalyticsPage() {
  redirect("/dashboard");
}
