import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Clerk middleware with route protection.
 *
 * When Clerk keys are present the middleware protects product routes.
 * When keys are absent (demo mode) the middleware is a plain passthrough
 * so the site still works without authentication.
 */

const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

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

function demoMiddleware(_req: NextRequest) {
  return NextResponse.next();
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  return NextResponse.next();
});

export default clerkEnabled ? clerkHandler : demoMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
