"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFidyaAuth } from "@/hooks/use-fidya-auth";
import { useLocale } from "@/components/providers/locale-provider";
import {
  BookOpen,
  CreditCard,
  Flame,
  LayoutDashboard,
  ChartNoAxesColumn,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Swords,
  User,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { ProBadge } from "@/components/ui/pro-badge";
import { isPro, readLocalPlan, resolvePlan } from "@/lib/plan";
import { isPublicRoute } from "@/lib/public-routes";
import { PublicHeader } from "./public-header";
import { CommandPalette } from "./command-palette";
import { NotificationBell } from "./notification-bell";

const NAV_ITEMS = [
  { href: "/dashboard", label: { en: "Dashboard", id: "Dasbor" }, icon: LayoutDashboard },
  { href: "/curriculum", label: { en: "My Curriculum", id: "Kurikulum Saya" }, icon: BookOpen },
  { href: "/tutor", label: { en: "AI Tutor", id: "AI Tutor" }, icon: Sparkles },
  { href: "/forge", label: { en: "Forge Review", id: "Review Forge" }, icon: Swords },
  { href: "/analytics", label: { en: "Analytics", id: "Analitik" }, icon: ChartNoAxesColumn },
] as const;

const COPY = {
  en: {
    primaryNav: "Primary",
    search: "Search (Cmd+K)",
    mobileSearch: "Search…",
    toggleTheme: "Toggle theme",
    streakTitle: "Learning streak — details on your dashboard",
    logIn: "Log in",
    accountMenu: "Account menu",
    loading: "Loading…",
    openMenu: "Open menu",
    profile: "Profile",
    settings: "Settings",
    subscription: "Subscription",
    helpCenter: "Help Center",
    logOut: "Log out",
  },
  id: {
    primaryNav: "Navigasi utama",
    search: "Cari (Cmd+K)",
    mobileSearch: "Cari…",
    toggleTheme: "Ganti tema",
    streakTitle: "Streak belajar — lihat detailnya di dasbor kamu",
    logIn: "Masuk",
    accountMenu: "Menu akun",
    loading: "Memuat…",
    openMenu: "Buka menu",
    profile: "Profil",
    settings: "Pengaturan",
    subscription: "Langganan",
    helpCenter: "Pusat Bantuan",
    logOut: "Keluar",
  },
} as const;

export function Navbar() {
  const { locale } = useLocale();
  const c = COPY[locale];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Re-apply the saved theme when entering the app (default: light)
  useEffect(() => {
    try {
      document.documentElement.classList.toggle(
        "dark",
        localStorage.getItem("fidya.theme") === "dark"
      );
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const { isLoaded, isSignedIn, user, signOut } = useFidyaAuth();
  const api = useApi();
  const [streak, setStreak] = useState<number | null>(null);
  const [plan, setPlan] = useState(() => readLocalPlan());

  useEffect(() => {
    if (!isLoaded) return;
    api
      .getProgress()
      .then((p) => setStreak(p.streak_days))
      .catch(() => setStreak(null));
    api
      .getMe()
      .then((me) => setPlan(resolvePlan(me.plan)))
      .catch(() => setPlan(readLocalPlan()));
  }, [api, isLoaded]);

  async function handleSignOut() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("fidya."))
      .forEach((k) => localStorage.removeItem(k));
    await signOut();
  }

  // Auth & onboarding flows render fully chrome-free — no navbar at all.
  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname === "/onboarding";
  if (isAuthRoute) return null;

  // Public marketing/legal routes get the marketing chrome, never the
  // authenticated-app navbar. The landing page renders its own header.
  // /subscribe is dual-purpose: app chrome for signed-in learners,
  // marketing chrome for everyone else.
  if (
    isPublicRoute(pathname) ||
    (pathname.startsWith("/subscribe") && !isSignedIn)
  ) {
    return pathname === "/" ? null : <PublicHeader />;
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-4">
      <div className="relative mx-auto max-w-4xl">
        <nav
          aria-label={c.primaryNav}
          className="glass-nav flex h-12 items-center gap-1 rounded-full border border-card-border bg-card/95 pl-1.5 pr-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.12)]"
        >
          {/* Brand */}
          <Link
            href={isSignedIn ? "/dashboard" : "/"}
            className="flex h-9 shrink-0 items-center gap-2 rounded-full px-2.5 text-sm font-bold tracking-tight hover:bg-tick-empty/40"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-accent text-[11px] font-extrabold text-white">
              F
            </span>
            <span className="hidden sm:inline">Fidya</span>
          </Link>

          {/* Center tabs — in normal flow, auto-centered between sides */}
          <ul className="mx-auto hidden items-center gap-0.5 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
                      active
                        ? "bg-accent text-white shadow-[0_2px_8px_rgba(79,70,229,0.35)]"
                        : "text-muted hover:bg-tick-empty/40 hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-3.5 shrink-0" />
                    <span className="hidden xl:inline">
                      {item.label[locale]}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right actions — always pinned right */}
          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              aria-label={c.search}
              onClick={() => setPaletteOpen(true)}
              className="hidden h-9 items-center gap-1.5 rounded-full border border-card-border px-3 text-[11px] font-medium text-muted transition-colors hover:bg-tick-empty/40 lg:flex"
            >
              <Search className="size-3.5" />
              <kbd className="font-sans">⌘K</kbd>
            </button>

            <button
              type="button"
              aria-label={c.toggleTheme}
              onClick={() => {
                const next = !document.documentElement.classList.contains("dark");
                document.documentElement.classList.toggle("dark", next);
                localStorage.setItem("fidya.theme", next ? "dark" : "light");
              }}
              className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-tick-empty/40 hover:text-foreground"
            >
              <Sun className="size-4 hidden dark:block" />
              <Moon className="size-4 dark:hidden" />
            </button>

            <NotificationBell />

            <div className="ml-1 hidden items-center gap-2 border-l border-card-border pl-2 sm:flex">
              <Link
                href="/dashboard"
                className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-1 text-[11px] font-semibold tabular-nums text-orange-500 transition-colors hover:bg-orange-500/20"
                title={c.streakTitle}
              >
                <Flame className="size-3" />
                {streak ?? 0}
              </Link>
              {isLoaded && !isSignedIn ? (
                <Link
                  href="/sign-in"
                  className="flex h-8 items-center rounded-full bg-accent px-4 text-[11px] font-semibold text-white"
                >
                  {c.logIn}
                </Link>
              ) : (
            <>
              {/* Visible Pro marker — mirrors how Google flags paid accounts */}
              <ProBadge plan={plan} compact className="hidden md:inline-flex" />
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  aria-label={c.accountMenu}
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((o) => !o)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-[11px] font-bold text-white transition-transform hover:scale-105",
                    isPro(plan)
                      ? "bg-gradient-to-br from-accent to-accent-strong shadow-[0_2px_10px_rgba(79,70,229,0.35)]"
                      : "bg-accent",
                    // Pro marker: the same circle you see when the menu is
                    // open, shown persistently for paid plans.
                    menuOpen || isPro(plan)
                      ? "ring-2 ring-accent/40 ring-offset-2 ring-offset-background"
                      : ""
                  )}
                >
                {user?.initials ?? "…"}
                </button>
              {menuOpen && (
                <div className="glass-nav absolute right-0 top-[calc(100%+10px)] z-[70] w-52 overflow-hidden rounded-3xl border border-card-border bg-card/95 py-2 shadow-xl">
                  <div className="px-4 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-semibold">
                        {user?.displayName ?? c.loading}
                      </p>
                      <ProBadge plan={plan} compact />
                    </div>
                    {user?.email && (
                      <p className="truncate text-[10px] text-muted">{user.email}</p>
                    )}
                  </div>
                  <div className="mx-4 my-1 border-t border-card-border" />
                  {[
                    { href: "/profile", label: c.profile, icon: User },
                    { href: "/settings", label: c.settings, icon: Settings },
                    { href: "/subscribe", label: c.subscription, icon: CreditCard },
                    { href: "/help", label: c.helpCenter, icon: LifeBuoy },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors",
                        pathname.startsWith(item.href)
                          ? "bg-accent-soft text-accent"
                          : "text-muted hover:bg-tick-empty/40 hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-3.5 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                  <div className="mx-4 my-1.5 border-t border-card-border" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
                  >
                    <LogOut className="size-3.5 shrink-0" />
                    {c.logOut}
                  </button>
                </div>
              )}
              </div>
            </>
              )}
            </div>

            <button
              type="button"
              aria-label={c.openMenu}
              onClick={() => setOpen((o) => !o)}
              className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-tick-empty/40 md:hidden"
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile drawer */}
        {open && (
          <div className="absolute inset-x-0 top-[calc(100%+8px)] md:hidden">
            <ul className="glass-nav animate-fade-up flex flex-col gap-1 rounded-3xl border border-card-border bg-card/95 p-2 shadow-xl">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setPaletteOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted transition-colors hover:bg-tick-empty/40 hover:text-foreground"
                >
                  <Search className="size-4 shrink-0" />
                  {c.mobileSearch}
                  <kbd className="ml-auto rounded-md border border-card-border px-1.5 py-0.5 text-[10px]">
                    ⌘K
                  </kbd>
                </button>
              </li>
              <li aria-hidden className="mx-4 my-1 border-t border-card-border" />
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent text-white"
                          : "text-muted hover:bg-tick-empty/40 hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.label[locale]}
                    </Link>
                  </li>
                );
              })}
              <li aria-hidden className="mx-4 my-1 border-t border-card-border" />
              {isSignedIn ? (
                <>
                  {[
                    { href: "/profile", label: c.profile, icon: User },
                    { href: "/subscribe", label: c.subscription, icon: CreditCard },
                    { href: "/settings", label: c.settings, icon: Settings },
                    { href: "/help", label: c.helpCenter, icon: LifeBuoy },
                  ].map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                            active
                              ? "bg-accent-soft text-accent"
                              : "text-muted hover:bg-tick-empty/40 hover:text-foreground"
                          )}
                        >
                          <item.icon className="size-4 shrink-0" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                  <li aria-hidden className="mx-4 my-1 border-t border-card-border" />
                  <li>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
                    >
                      <LogOut className="size-4 shrink-0" />
                      {c.logOut}
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/sign-in"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white"
                  >
                    {c.logIn}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        )}

        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </header>
  );
}
