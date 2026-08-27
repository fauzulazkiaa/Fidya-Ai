"use client";

import {
  defaultOnboarding,
  mockSyllabus,
} from "./mock-data";
import type { OnboardingPayload, Syllabus } from "./types";

const ONBOARDING_KEY = "fidya.onboarding";
const SYLLABUS_KEY = "fidya.syllabus";

export async function saveOnboarding(
  payload: OnboardingPayload
): Promise<Syllabus> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(payload));
  }
  const syllabus = generateSyllabusFrom(payload);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SYLLABUS_KEY, JSON.stringify(syllabus));
  }
  return syllabus;
}

export async function getOnboarding(): Promise<OnboardingPayload> {
  const base = defaultOnboarding;
  if (typeof window === "undefined") return base;
  try {
    const rawSettings = window.localStorage.getItem("fidya.settings");
    if (rawSettings) {
      const s = JSON.parse(rawSettings);
      base.current_level = s.default_level ?? base.current_level;
      base.hours_per_week = s.default_hours ?? base.hours_per_week;
    }
  } catch {
    /* ignore malformed settings */
  }
  const raw = window.localStorage.getItem(ONBOARDING_KEY);
  return raw ? { ...base, ...JSON.parse(raw) } : base;
}

export async function getSyllabus(): Promise<Syllabus> {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(SYLLABUS_KEY);
    if (raw) return JSON.parse(raw);
  }
  return mockSyllabus;
}

export async function setModuleCompleted(
  moduleId: string,
  completed: boolean
): Promise<Syllabus> {
  const syllabus = await getSyllabus();
  const next = structuredClone(syllabus);
  const mod = next.modules.find((m) => m.module_id === moduleId);
  if (mod) {
    mod.completion = completed ? 100 : Math.min(mod.completion, 50);
    mod.status = completed
      ? "completed"
      : mod.completion > 0
        ? "in_progress"
        : "available";
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SYLLABUS_KEY, JSON.stringify(next));
  }
  return next;
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "";
  try {
    const s = JSON.parse(localStorage.getItem("fidya.settings") || "{}");
    return typeof s.display_name === "string" ? s.display_name : "";
  } catch {
    return "";
  }
}

function slugTopic(topic: string) {
  return (
    topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "custom-goal"
  );
}

function generateSyllabusFrom(payload: OnboardingPayload): Syllabus {
  const base = structuredClone(mockSyllabus);
  const weeks = Math.max(2, Math.min(12, Math.round(60 / 7)));
  base.curriculum_id = `curr_${slugTopic(payload.target_topic)}_${Date.now()
    .toString(36)
    .slice(-5)}`;
  base.target_topic = payload.target_topic || base.target_topic;
  base.current_level = payload.current_level;
  base.target_outcome = payload.target_outcome || base.target_outcome;
  base.target_deadline = payload.target_deadline;
  base.hours_per_week = payload.hours_per_week;
  base.learning_style = payload.learning_style;

  const start = new Date();
  base.milestones = Array.from({ length: Math.min(weeks, 6) }, (_, i) => {
    const d = new Date(start.getTime() + ((i + 1) * 7 - 1) * 86400000);
    return {
      id: `ms-${i + 1}`,
      title:
        i === Math.min(weeks, 6) - 1
          ? `Final capstone: ${payload.target_outcome || base.target_topic}`
          : `Week ${i + 1} checkpoint review`,
      date: d.toISOString().slice(0, 10),
      week: i + 1,
      kind: (i === Math.min(weeks, 6) - 1
        ? "milestone"
        : i % 2 === 0
          ? "assessment"
          : "project") as Syllabus["milestones"][number]["kind"],
    };
  });
  return base;
}
