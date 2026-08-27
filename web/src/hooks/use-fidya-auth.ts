"use client";

/**
 * Unified auth hook — Clerk-backed when configured, local mock otherwise.
 *
 * Usage:
 *   const { user, isLoaded, signOut } = useFidyaAuth();
 */

import { useMemo } from "react";
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/nextjs";
import { clerkEnabled } from "@/components/providers/auth-provider";

export interface FidyaUser {
  id: string;
  displayName: string;
  initials: string;
  email: string | null;
}

export interface FidyaAuth {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: FidyaUser | null;
  signOut: () => Promise<void>;
}

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

/** Demo-mode auth: always signed in as the local profile. */
function useMockFidyaAuth(): FidyaAuth {
  return useMemo(() => {
    let displayName = "Fauzul Azkia";
    try {
      const raw = localStorage.getItem("fidya.settings");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.display_name) displayName = s.display_name;
      }
    } catch {
      /* noop */
    }
    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: "mock-user",
        displayName,
        initials: initialsOf(displayName),
        email: null,
      },
      signOut: async () => {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("fidya."))
          .forEach((k) => localStorage.removeItem(k));
        // Full reload intentionally clears in-memory demo state.
        window.top?.location.replace("/");
      },
    };
  }, []);
}

/** Real auth backed by Clerk components & hooks. */
function useClerkFidyaAuth(): FidyaAuth {
  const clerkUser = useClerkUser();
  const clerkAuth = useClerkAuth();

  return useMemo(() => {
    const isSignedIn = clerkAuth.isLoaded && !!clerkAuth.isSignedIn;
    const u = clerkUser.user;
    return {
      isLoaded: clerkAuth.isLoaded && clerkUser.isLoaded,
      isSignedIn,
      user:
        isSignedIn && u
          ? {
              id: u.id,
              displayName:
                u.fullName ||
                u.username ||
                u.primaryEmailAddress?.emailAddress ||
                "Learner",
              initials: initialsOf(u.fullName || u.username || "U"),
              email: u.primaryEmailAddress?.emailAddress ?? null,
            }
          : null,
      signOut: async () => {
        await clerkAuth.signOut({ redirectUrl: "/" });
      },
    };
  }, [clerkAuth, clerkUser]);
}

/**
 * Branch is fixed per deployment (env var), so hook order is stable.
 */
export function useFidyaAuth(): FidyaAuth {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return clerkEnabled ? useClerkFidyaAuth() : useMockFidyaAuth();
}
