/**
 * Public marketing/legal routes must never render the authenticated-app
 * chrome (dashboard navbar, app footer, support widget). One shared check
 * so every chrome component agrees on what is "public".
 */
const MARKETING_PREFIXES = [
  "/about",
  "/team",
  "/careers",
  "/contact",
  "/blog",
  "/changelog",
  "/roadmap",
  "/status",
  "/help",
  "/study-guides",
  "/webinars",
  "/customers",
  "/business",
  "/api-docs",
  "/security",
  "/privacy",
  "/terms",
  "/cookies",
  "/solutions",
] as const;

export function isPublicRoute(pathname: string): boolean {
  if (pathname === "/" || pathname === "/onboarding") return true;
  if (
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")
  )
    return true;
  return MARKETING_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
