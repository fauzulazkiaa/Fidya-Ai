"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CreditCard,
  FileUp,
  Loader2,
  Save,
  Settings as Cog,
  GraduationCap,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProBadge } from "@/components/ui/pro-badge";
import { useApi } from "@/hooks/use-api";
import { useFidyaAuth } from "@/hooks/use-fidya-auth";
import {
  PLAN_LABELS,
  isPro,
  readLocalPlan,
} from "@/lib/plan";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fidya.settings";

interface AppSettings {
  display_name: string;
  email: string;
  notify_email: boolean;
  notify_streak: boolean;
  notify_milestones: boolean;
  notify_reengage: boolean;
  default_hours: number;
  default_level: string;
}

const DEFAULTS: AppSettings = {
  display_name: "",
  email: "",
  notify_email: true,
  notify_streak: true,
  notify_milestones: true,
  notify_reengage: true,
  default_hours: 10,
  default_level: "Intermediate",
};

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const HOURS = [4, 6, 10, 12, 15, 20];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [plan, setPlan] = useState(() => readLocalPlan());
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const api = useApi();
  const { user, signOut } = useFidyaAuth();
  const router = useRouter();

  async function uploadDoc(file: File) {
    setUploading(true);
    setUploadError("");
    setUploadStatus(`Indexing ${file.name}…`);
    try {
      const res = await api.uploadDocument(file);
      setUploadStatus(
        `${res.filename} — ${res.chunks_indexed} chunks indexed. Your lessons can now cite this document.`
      );
    } catch (e) {
      setUploadError(
        `Upload failed: ${(e as Error).message.replace(/^API \d+:\s*/, "")}`
      );
      setUploadStatus("");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    api
      .getMe()
      .then((me) => {
        if (me.plan && me.plan !== "free") {
          // Backend has a persisted paid plan — it wins.
          localStorage.setItem("fidya.plan", me.plan);
          setPlan(me.plan);
        }
      })
      .catch(() => {});
  }, [api]);

  useEffect(() => {
    Promise.resolve().then(async () => {
      let base = { ...DEFAULTS };
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) base = { ...base, ...JSON.parse(raw) };
      } catch {
        /* ignore */
      }
      // Identity always comes from the signed-in account, never localStorage.
      if (user) {
        base.display_name = user.displayName;
        base.email = user.email ?? "";
      }
      try {
        const me = await api.getMe();
        if (me.display_name && user) base.display_name = me.display_name;
      } catch {
        /* backend unreachable — keep Clerk values */
      }
      setSettings(base);
      setHydrated(true);
    });
  }, [api, user]);

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((s) => {
      const next = { ...s, [key]: value };
      // Notification toggles apply instantly — no separate save step needed.
      if (key.startsWith("notify_")) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        dirty.current = false;
      } else {
        dirty.current = true;
      }
      return next;
    });
    setSaved(false);
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Delete your account and ALL learning data permanently? This cannot be undone."
    );
    if (!confirmed) return;
    try {
      localStorage.clear();
      sessionStorage.clear();
      await signOut();
    } catch {
      /* fall through to redirect */
    }
    router.replace("/");
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      // Display name is persisted to the backend account; the rest are
      // device preferences kept in localStorage.
      await api.updateMe(settings.display_name || "Learner");
    } catch {
      /* non-fatal — still keep local prefs */
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    dirty.current = false;
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!hydrated) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 pb-1 pt-2">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <Cog className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Settings</h1>
            <p className="text-xs text-muted">Account & preferences</p>
          </div>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 rounded-full bg-citation-public/10 px-3 py-1.5 text-xs font-medium text-citation-public">
            <Check className="size-3.5" /> Saved
          </span>
        )}
      </header>

      <div className="mt-4 space-y-4 pb-24">
        {/* Account */}
        <Section
          icon={<UserRound className="size-3.5" />}
          title="Account"
          description="Your identity across Fidya."
        >
          <Field label="Display name">
            <input
              value={settings.display_name}
              onChange={(e) => update("display_name", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Email (managed by your sign-in provider)">
            <input
              type="email"
              value={settings.email}
              readOnly
              className={cn(inputCls, "cursor-not-allowed text-muted")}
            />
          </Field>
        </Section>

        {/* Subscription */}
        <Section
          icon={<CreditCard className="size-3.5" />}
          title="Subscription"
          description="Your plan controls agent limits, BYOD uploads and analytics depth."
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-card-border bg-background px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <p className="text-sm font-semibold">{PLAN_LABELS[plan] ?? "Starter"}</p>
              <ProBadge plan={plan} />
            </div>
            <Link href="/subscribe">
              <Button variant={isPro(plan) ? "secondary" : "primary"} size="sm">
                {isPro(plan) ? "Manage plan" : "Upgrade"}
              </Button>
            </Link>
          </div>
        </Section>

        {/* Notifications */}
        <Section
          icon={<Bell className="size-3.5" />}
          title="Notifications"
          description="Toggles apply instantly. Theme lives in the header — switch it anytime with the sun/moon button."
        >
          <ToggleRow
            label="Email digest"
            desc="Weekly progress summary sent to your email"
            checked={settings.notify_email}
            onChange={(v) => update("notify_email", v)}
          />
          <ToggleRow
            label="Streak reminders"
            desc="Nudge me before I lose my learning streak"
            checked={settings.notify_streak}
            onChange={(v) => update("notify_streak", v)}
          />
          <ToggleRow
            label="Milestone alerts"
            desc="Remind me when a weekly assessment or capstone milestone in my curriculum is due within 7 days"
            checked={settings.notify_milestones}
            onChange={(v) => update("notify_milestones", v)}
          />
          <ToggleRow
            label="Come-back motivation"
            desc="If I haven't logged in for a few days, send a short motivational email with my progress and an easy way to resume"
            checked={settings.notify_reengage}
            onChange={(v) => update("notify_reengage", v)}
          />
        </Section>

        {/* Learning defaults */}
        <Section
          icon={<GraduationCap className="size-3.5" />}
          title="Learning Defaults"
          description="Pre-fills the Baseline and Time Commitment steps whenever The Architect builds a new curriculum, so you skip re-answering them."
        >
          <Field label="Default level">
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lv) => (
                <Chip
                  key={lv}
                  active={settings.default_level === lv}
                  onClick={() => update("default_level", lv)}
                >
                  {lv}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="Hours per week">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {HOURS.map((h) => (
                <Chip
                  key={h}
                  active={settings.default_hours === h}
                  onClick={() => update("default_hours", h)}
                  className="py-2 text-center text-sm font-bold tabular-nums"
                >
                  {h}
                </Chip>
              ))}
            </div>
          </Field>
        </Section>

        {/* BYOD — private document ingestion (US-020) */}
        <Section
          icon={<FileUp className="size-3.5" />}
          title="Private Documents (BYOD)"
          description="Upload your own PDF, TXT or Markdown notes (max 10 MB). They are indexed into your private knowledge namespace and take priority over public sources when lessons are synthesized."
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadDoc(f);
                e.target.value = "";
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
              )}
              {uploading ? "Indexing…" : "Upload document"}
            </Button>
            <span
              className={cn(
                "text-xs",
                uploadError ? "text-red-500" : "text-muted"
              )}
            >
              {uploadError ||
                uploadStatus ||
                "PDF, TXT or MD · stored privately, visible only to you"}
            </span>
          </div>
        </Section>

        {/* Danger zone */}
        <Card className="border-red-500/30 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-red-500">
            <ShieldAlert className="size-4" /> Danger Zone
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Permanently delete your account, curricula, and all learning data.
            This cannot be undone.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3 text-red-500 hover:bg-red-500/10"
            onClick={deleteAccount}
          >
            Delete Account
          </Button>
        </Card>
      </div>

      {/* Sticky save bar */}
      <div className="pointer-events-none sticky bottom-4 z-20 flex justify-end">
        <Button
          onClick={save}
          disabled={saving}
          className="pointer-events-auto shadow-xl"
          aria-label="Save changes"
        >
          <Save className="size-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-card-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent";

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {icon && (
            <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft text-accent">
              {icon}
            </span>
          )}
          {title}
        </h2>
        {description && <p className="mt-1 pl-8 text-xs text-muted">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3 py-2.5 text-xs font-medium transition-all",
        active
          ? "border-accent bg-accent-soft text-accent shadow-[0_0_0_1px_var(--accent)]"
          : "border-card-border text-muted hover:border-accent/40",
        className
      )}
    >
      {children}
    </button>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="-mx-1 flex items-center justify-between gap-4 rounded-2xl px-1 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-tick-empty"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}
