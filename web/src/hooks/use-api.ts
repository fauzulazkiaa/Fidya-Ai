"use client";

/**
 * Typed API client for the Fidya FastAPI backend.
 * Attach the Clerk session token automatically (verified server-side via JWKS).
 */

import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { clerkEnabled } from "@/components/providers/auth-provider";

// Same-origin by default: next.config.ts proxies /api/v1 to the FastAPI
// backend, so no CORS is involved. Set NEXT_PUBLIC_API_URL to call the
// backend directly (e.g. when the proxy is not configured).
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export interface Curriculum {
  curriculum_id: string;
  target_topic: string;
  current_level: string;
  target_outcome?: string;
  target_deadline: string;
  hours_per_week: number;
  learning_style: string;
  curriculum_title?: string;
  status?: "active" | "paused" | "completed";
  modules: CurriculumModule[];
  milestones: { id: string; title: string; date: string; week: number; kind: string }[];
}

export interface CurriculumModule {
  module_id: string;
  order: number;
  week: number;
  day: number;
  title: string;
  domain: string;
  objectives: string[];
  estimated_hours: number;
  tags: string[];
  search_keywords?: string[];
  status: "locked" | "available" | "in_progress" | "completed";
  completion: number;
  content_markdown?: string;
  citations?: {
    chunk_id: string;
    index: number;
    source_title: string;
    source_url: string;
    author: string;
    snippet: string;
    kind: "public" | "private";
  }[];
}

export interface ProgressData {
  streak_days: number;
  overall_completion: number;
  modules_completed: number;
  modules_total: number;
  hours_studied: number;
  citation_clicks: number;
  velocity: { label: string; hours: number }[];
  mastery: { concept: string; score: number }[];
}

export interface AppNotification {
  kind: string;
  title: string;
  desc: string;
  date: string;
}

export interface TutorSession {
  session_key: string;
  curriculum_id: string;
  module_id: string;
  started_at: string;
  pinned?: boolean;
  title?: string;
  messages: { role: string; content: string; mastery?: number | null }[];
}

export interface ForgeReviewResult {
  summary: string;
  strengths: string[];
  vulnerabilities: { line?: number; paragraph?: number; note: string }[];
  suggested_refactors: { title: string; diff: string }[];
  rubric_scores: { name: string; score: number; max: number }[];
}

export function useApi() {
  const { getToken } = useAuth();

  return useMemo(() => {
    async function authHeaders(json: boolean): Promise<Record<string, string>> {
      const headers: Record<string, string> = {};
      if (json) headers["Content-Type"] = "application/json";
      if (clerkEnabled) {
        try {
          const token = await getToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        } catch {
          /* unauthenticated */
        }
      }
      return headers;
    }

    async function request<T>(
      method: string,
      path: string,
      body?: unknown
    ): Promise<T> {
      const headers = await authHeaders(body !== undefined);
      let res: Response;
      try {
        res = await fetch(`${API_BASE}${path}`, {
          method,
          headers,
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
      } catch {
        throw new Error(
          "Tidak bisa terhubung ke server AI. Pastikan backend berjalan (uvicorn app.main:app --port 8000) dan buka aplikasi lewat http://localhost:3000."
        );
      }
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
      }
      return res.json() as Promise<T>;
    }

    return {
      listCurricula: () =>
        request<{ curricula: Curriculum[] }>("GET", "/curriculum").then(
          (d) => d.curricula
        ),
      getCurriculum: (id: string) =>
        request<Curriculum>("GET", `/curriculum/${id}`),
      generateCurriculum: (payload: {
        target_topic: string;
        current_level: string;
        target_outcome: string;
        target_deadline: string;
        hours_per_week: number;
        learning_style: string;
      }) =>
        request<{ curriculum: Curriculum }>(
          "POST",
          "/curriculum/generate",
          payload
        ).then((d) => d.curriculum),
      synthesizeModule: (curriculumId: string, moduleId: string) =>
        request<{
          status: string;
          verification_status: string;
          content_markdown: string;
          citations: CurriculumModule["citations"];
          notes: string[];
        }>("POST", `/curriculum/${curriculumId}/modules/${moduleId}/synthesize`),
      completeModule: (
        curriculumId: string,
        moduleId: string,
        completed: boolean
      ) =>
        request<{ ok: boolean }>(
          "PATCH",
          `/curriculum/${curriculumId}/modules/${moduleId}/complete?completed=${completed}`
        ),
      inquisitorChat: (
        curriculumId: string,
        moduleId: string,
        message: string,
        history: { role: "user" | "assistant"; content: string }[] = [],
        sessionId = ""
      ) =>
        request<{ reply: string; mastery: number; hint: string }>(
          "POST",
          "/agent/inquisitor/chat",
          // Empty ids switch The Inquisitor to free-topic mode: the learner
          // can explore ANY subject, not just planned modules.
          {
            curriculum_id: curriculumId,
            module_id: moduleId,
            session_id: sessionId,
            message,
            history,
          }
        ),
      streamInquisitorChat: async (
        curriculumId: string,
        moduleId: string,
        message: string,
        history: { role: "user" | "assistant"; content: string }[],
        sessionId: string,
        onToken: (text: string) => void
      ): Promise<{ reply: string; mastery: number; hint: string }> => {
        // Real SSE streaming (FR-8): the reply renders token-by-token as
        // Gemini generates it — no client-side fake typing effect.
        const res = await fetch(`${API_BASE}/agent/inquisitor/chat/stream`, {
          method: "POST",
          headers: await authHeaders(true),
          body: JSON.stringify({
            curriculum_id: curriculumId,
            module_id: moduleId,
            session_id: sessionId,
            message,
            history,
          }),
        });
        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => res.statusText);
          throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let final = { reply: "", mastery: 3, hint: "" };
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const evt of events) {
            const line = evt.trim();
            if (!line.startsWith("data:")) continue;
            try {
              const data = JSON.parse(line.slice(5).trim());
              if (data.event === "token" && data.text) onToken(data.text);
              if (data.event === "done")
                final = {
                  reply: data.reply ?? final.reply,
                  mastery: data.mastery ?? final.mastery,
                  hint: data.hint ?? final.hint,
                };
              if (data.event === "error")
                throw new Error(data.message || "Streaming failed");
            } catch (e) {
              if (e instanceof SyntaxError) continue; // partial JSON
              throw e;
            }
          }
        }
        return final;
      },
      uploadDocument: async (file: File) => {
        const form = new FormData();
        form.append("file", file);
        const headers = await authHeaders(false);
        const res = await fetch(`${API_BASE}/documents/upload`, {
          method: "POST",
          headers,
          body: form,
        });
        if (!res.ok) {
          const text = await res.text().catch(() => res.statusText);
          throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
        }
        return res.json() as Promise<{
          document_id: string;
          filename: string;
          chunks_indexed: number;
          namespace: string;
        }>;
      },
      forgeReview: (
        submissionType: "auto" | "code" | "essay" | "design",
        content: string,
        context = ""
      ) =>
        request<{ review: ForgeReviewResult }>("POST", "/agent/forge/review", {
          submission_type: submissionType,
          content,
          context,
        }),
      catalystSpark: (concept: string, context = "") =>
        request<{ spark: { concept: string; from_domain: string; to_domain: string; insight: string } }>(
          "POST",
          "/agent/catalyst/spark",
          { concept, context }
        ),
      getProgress: () => request<ProgressData>("GET", "/analytics/progress"),
      getNotifications: () =>
        request<{ notifications: AppNotification[] }>(
          "GET",
          "/analytics/notifications"
        ),
      getTutorHistory: () =>
        request<{ sessions: TutorSession[] }>("GET", "/agent/inquisitor/history"),
      deleteTutorSession: (sessionId: string) =>
        request<{ ok: boolean }>(
          "DELETE",
          `/agent/inquisitor/history/${encodeURIComponent(sessionId)}`
        ),
      pinTutorSession: (sessionId: string, pinned: boolean) =>
        request<{ ok: boolean; pinned: boolean }>(
          "PATCH",
          `/agent/inquisitor/history/${encodeURIComponent(sessionId)}`,
          { pinned }
        ),
      subscribeNewsletter: (email: string, source = "footer") =>
        request<{ ok: boolean; welcome_email_sent: boolean }>(
          "POST",
          "/newsletter/subscribe",
          { email, source }
        ),
      setCurriculumStatus: (curriculumId: string, status: string) =>
        request<{ ok: boolean; message: string }>(
          "PATCH",
          `/curriculum/${curriculumId}/status?status=${status}`
        ),
      deleteCurriculum: (curriculumId: string) =>
        request<{ ok: boolean }>("DELETE", `/curriculum/${curriculumId}`),
      getMe: () =>
        request<{
          id: string;
          email: string;
          display_name: string;
          plan: string;
          created_at?: string;
        }>("GET", "/auth/me"),
      updateMe: (displayName: string) =>
        request<{ ok: boolean }>(
          "PATCH",
          `/auth/me?display_name=${encodeURIComponent(displayName)}`
        ),
      updatePlan: (plan: string) =>
        request<{ ok: boolean; plan: string }>(
          "PATCH",
          `/auth/me/plan?plan=${encodeURIComponent(plan)}`
        ),
      trackEvent: (type: string, meta = "") =>
        request<{ ok: boolean }>(
          "POST",
          `/analytics/events?type=${encodeURIComponent(type)}&meta=${encodeURIComponent(meta)}`,
          {}
        ),
    };
  }, [getToken]);
}
