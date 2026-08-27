import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Clerk middleware with route protection.
 *
 * PUBLIC  : landing (/), pricing (/subscribe), marketing pages (about,
 *           contact, careers, roadmap, changelog, privacy), terms, help
 *           and sign-in/sign-up.
 * PRIVATE : everything that is part of the product (dashboard, curriculum,
 *           tutor, forge, analytics, profile, settings, onboarding)
 *
 * Unauthenticated visitors are redirected to /sign-in automatically.
 */

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/curriculum(.*)",
  "/tutor(.*)",
  "/forge(.*)",
  "/analytics(.*)",
  "/profile(.*)",
  "/settings(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Protect specific routes only
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
