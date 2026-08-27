import type { ReactNode } from "react";

/**
 * `clerk init` adds <ClerkProvider> directly in src/app/layout.tsx, so this
 * component is intentionally a passthrough kept for future app-level auth
 * context. Do NOT add another ClerkProvider here — it must appear only once.
 *
 * Keys live in .env.local (created by `clerk init`). See also:
 *   - src/middleware.ts        (Clerk proxy)
 *   - src/hooks/use-fidya-auth.ts  (unified useFidyaAuth hook)
 */
export const clerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
