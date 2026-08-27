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
    // Skip Next.js internals & static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Clerk auto-proxy path
    "/__clerk/:path*",
  ],
};
