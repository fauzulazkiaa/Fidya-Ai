"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  Lightbulb,
  Mic,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useApi,
  type Curriculum,
  type TutorSession,
} from "@/hooks/use-api";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const STARTERS = [
  "Quiz me on this module",
  "Explain the core concept differently",
  "Where is my understanding weakest?",
];

const FREE_STARTERS = [
  "I want to learn about game theory",
  "Help me understand how vaccines work",
  "Quiz me on world history",
];

/* Minimal typings for the Web Speech API (not in default lib.dom yet). */
type RecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

export default function TutorPage() {
  return (
    <Suspense
      fallback={
        <div
          className="relative mx-auto flex h-[calc(100dvh-7.5rem)] w-full max-w-6xl gap-3 px-4 sm:px-6"
          aria-busy
        >
          {/* History rail (desktop) */}
          <div className="hidden w-60 shrink-0 flex-col gap-2 md:flex">
            <div className="skeleton h-9 w-full rounded-2xl" />
            <div className="skeleton h-3 w-16" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-9 w-full rounded-xl" />
            ))}
          </div>
          {/* Chat column */}
          <div className="flex min-w-0 flex-1 flex-col">
            <Card className="flex shrink-0 items-center gap-2 py-2.5 pl-3 pr-2.5">
              <div className="skeleton size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 w-28" />
                <div className="skeleton h-2.5 w-48 max-w-full" />
              </div>
            </Card>
            <div className="mt-3 flex min-h-0 flex-1 flex-col justify-end gap-4 rounded-3xl border border-card-border bg-card/40 p-4 sm:p-5">
              <div className="flex items-end gap-2.5">
                <div className="skeleton size-8 shrink-0 rounded-full" />
                <div className="skeleton h-16 w-3/5 rounded-3xl" />
              </div>
              <div className="flex items-end justify-end gap-2.5">
                <div className="skeleton h-10 w-2/5 rounded-3xl" />
                <div className="skeleton size-8 shrink-0 rounded-full" />
              </div>
            </div>
            <Card className="mt-3 flex shrink-0 items-center gap-2 p-2">
              <div className="skeleton size-10 shrink-0 rounded-full" />
              <div className="skeleton h-10 flex-1 rounded-full" />
              <div className="skeleton size-10 shrink-0 rounded-full" />
            </Card>
          </div>
        </div>
      }
    >
      <TutorInner />
    </Suspense>
  );
}

function relativeDay(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0)
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function newSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function TutorInner() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get("module");
  // Which curriculum is active — query param wins, else last selection.
  const requestedCurriculum = searchParams.get("curriculum") ?? "";
  const [activeCurriculumId, setActiveCurriculumId] = useState("");
  const api = useApi();
  const [curricula, setCurricula] = useState<Curriculum[] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessions, setSessions] = useState<TutorSession[] | null>(null);
  // Explicit conversation id — keeps "New chat" separate from old history
  // even when messages land within minutes of each other.
  const [sessionId, setSessionId] = useState(newSessionId);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);

  useEffect(() => {
    api.listCurricula().then(setCurricula).catch(() => setCurricula([]));
  }, [api]);

  const refreshSessions = useCallback(() => {
    api
      .getTutorHistory()
      .then((d) => setSessions(d.sessions))
      .catch(() => setSessions([]));
  }, [api]);

  useEffect(() => {
    refreshSessions();
    return () => {
      // Stop any running speech/stream when leaving the page.
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    };
  }, [refreshSessions]);

  // Resolve the active curriculum once the list arrives.
  useEffect(() => {
    if (!curricula) return;
    Promise.resolve().then(() => {
      const byParam =
        (requestedCurriculum &&
          curricula.find((c) => c.curriculum_id === requestedCurriculum)) ||
        undefined;
      setActiveCurriculumId(
        byParam?.curriculum_id ?? curricula[0]?.curriculum_id ?? ""
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curricula]);

  // Strict isolation: only modules of the ACTIVE curriculum are ever used.
  const activeCurriculum =
    curricula?.find((c) => c.curriculum_id === activeCurriculumId) ??
    curricula?.find((c) => c.modules.some((m) => m.module_id === moduleId)) ??
    null;
  const activeModule =
    (moduleId &&
      activeCurriculum?.modules.find((m) => m.module_id === moduleId)) ||
    activeCurriculum?.modules.find((m) => m.status === "in_progress") ||
    activeCurriculum?.modules.find((m) => m.status === "available") ||
    activeCurriculum?.modules[0];

  const lastMastery = [...messages]
    .reverse()
    .find((m) => m.role === "inquisitor" && m.mastery)?.mastery;

  /** Placeholder bubble for the streaming reply; tokens are appended live. */
  function openStreamBubble(hint?: string) {
    const id = `i${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id, role: "inquisitor", content: "", hint },
    ]);
    return id;
  }

  const sendFn = useRef<(text?: string) => void>(() => {});
  const send = useCallback(
    (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || thinking) return;
      setInput("");
      setThinking(true);
      const history = messages
        .filter((m) => !m.content.startsWith("⚠️"))
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        }));
      setMessages((m) => [
        ...m,
        { id: `u${Date.now()}`, role: "user", content },
      ]);
      if (history.length === 0) {
        // New conversation — counts toward streak & analytics.
        api.trackEvent("tutor_session", content.slice(0, 80)).catch(() => {});
      }
      const bubbleId = openStreamBubble();
      api
        .streamInquisitorChat(
          activeCurriculum?.curriculum_id ?? "",
          activeModule?.module_id ?? "",
          content,
          history,
          sessionId,
          (token) => {
            setMessages((ms) =>
              ms.map((msg) =>
                msg.id === bubbleId
                  ? { ...msg, content: msg.content + token }
                  : msg
              )
            );
          }
        )
        .then((res) => {
          // The done event carries the canonical full text + mastery + hint.
          setMessages((ms) =>
            ms.map((msg) =>
              msg.id === bubbleId
                ? {
                    ...msg,
                    content: res.reply || msg.content,
                    mastery: res.mastery ?? msg.mastery,
                    hint: res.hint || msg.hint,
                  }
                : msg
            )
          );
        })
        .catch((e: Error) => {
          setMessages((m) =>
            m.map((msg) =>
              msg.id === bubbleId && !msg.content
                ? { ...msg, content: `⚠️ ${e.message}` }
                : msg
            )
          );
        })
        .finally(() => {
          setThinking(false);
          refreshSessions();
        });
    },
    [input, thinking, activeModule, activeCurriculum, api, messages, refreshSessions, sessionId]
  );

  useEffect(() => {
    sendFn.current = send;
  }, [send]);

  useEffect(() => {
    if (!started.current && curricula && activeModule && moduleId) {
      started.current = true;
      sendFn.current(
        `I'm studying "${activeModule.title}". Start the Socratic dialogue.`
      );
    }
  }, [curricula, activeModule, moduleId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  function newChat() {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    setMessages([]);
    setSpeakingId(null);
    setFeedback({});
    setSessionId(newSessionId());
    started.current = true;
    setDrawerOpen(false);
  }

  function loadSession(s: TutorSession) {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    setSpeakingId(null);
    // Continuing an existing conversation stays inside the SAME session.
    // Legacy (pre-session-id) conversations get a fresh id so any new
    // messages form their own entry instead of corrupting the old one.
    setSessionId(
      s.session_key.startsWith("legacy|") ? newSessionId() : s.session_key
    );
    setMessages(
      s.messages.map((m, i) => ({
        id: `h${i}`,
        role: m.role === "user" ? ("user" as const) : ("inquisitor" as const),
        content: m.content,
        mastery: m.mastery ?? undefined,
      }))
    );
    started.current = true;
    setDrawerOpen(false);
  }

  async function removeSession(e: React.MouseEvent, s: TutorSession) {
    e.stopPropagation();
    await api.deleteTutorSession(s.session_key).catch(() => {});
    refreshSessions();
  }

  async function togglePin(e: React.MouseEvent, s: TutorSession) {
    e.stopPropagation();
    const next = !s.pinned;
    // Optimistic UI.
    setSessions(
      (list) =>
        list?.map((x) =>
          x.session_key === s.session_key ? { ...x, pinned: next } : x
        ) ?? list
    );
    await api.pinTutorSession(s.session_key, next).catch(() => {});
    refreshSessions();
  }

  /* ------------------------------ voice input --------------------------- */
  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const w = window as unknown as {
      SpeechRecognition?: new () => RecognitionLike;
      webkitSpeechRecognition?: new () => RecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setInput((v) => v || "Voice input is not supported in this browser.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) setInput((v) => (v ? `${v} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  /* ---------------------------- text-to-speech -------------------------- */
  function toggleSpeak(m: ChatMessage) {
    try {
      const synth = window.speechSynthesis;
      if (!synth) return;
      if (speakingId === m.id) {
        synth.cancel();
        setSpeakingId(null);
        return;
      }
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(m.content);
      utter.rate = 1.02;
      utter.onend = () => setSpeakingId(null);
      utter.onerror = () => setSpeakingId(null);
      setSpeakingId(m.id);
      synth.speak(utter);
    } catch {}
  }

  /* ------------------------------- feedback ----------------------------- */
  function rateMessage(m: ChatMessage, kind: "up" | "down") {
    setFeedback((f) => ({ ...f, [m.id]: f[m.id] === kind ? undefined : kind } as Record<string, "up" | "down">));
    api.trackEvent(`feedback_${kind}`, m.content.slice(0, 120)).catch(() => {});
  }

  function regenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || thinking) return;
    // Drop everything after that question and ask again.
    const idx = messages.findIndex((m) => m.id === lastUser.id);
    setMessages(messages.slice(0, idx));
    setTimeout(() => sendFn.current(lastUser.content), 30);
  }

  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === "inquisitor")?.id;

  return (
    <div className="relative mx-auto flex h-[calc(100dvh-7.5rem)] w-full max-w-6xl gap-3 px-4 sm:px-6">
      {/* Persistent history rail (desktop) */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col md:flex",
          sidebarOpen ? "w-60" : "w-0 overflow-hidden"
        )}
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={newChat}
          className="mb-3 justify-start gap-2 rounded-2xl"
        >
          <Plus className="size-4" /> New chat
        </Button>
        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          History
        </p>
        <div className="scrollbar-thin -mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          <SessionList
            sessions={sessions}
            curricula={curricula}
            activeFirstMessage={messages[0]?.content}
            onSelect={loadSession}
            onDelete={removeSession}
            onPin={togglePin}
          />
        </div>
      </aside>

      {/* Chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <Card className="flex shrink-0 items-center gap-2 py-2.5 pl-3 pr-2.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle history sidebar"
            title="Toggle history"
            onClick={() => setSidebarOpen((o) => !o)}
            className="hidden md:flex"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tutoring history"
            onClick={() => setDrawerOpen(true)}
            className="md:hidden"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-white">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold">AI Tutor</h1>
              <Badge tone="accent">The Inquisitor</Badge>
              {lastMastery && (
                <Badge tone={lastMastery >= 4 ? "public" : "neutral"}>
                  Mastery {lastMastery}/5
                </Badge>
              )}
            </div>
            <p className="truncate text-[11px] text-muted">
              Socratic mode — guides with questions, never direct answers
              {activeModule ? ` · ${activeModule.title}` : ""}
            </p>
          </div>
          {/* Curriculum switcher — keeps parallel syllabi isolated */}
          {curricula && curricula.length > 1 && (
            <div className="relative hidden sm:block">
              <select
                aria-label="Active curriculum"
                value={activeCurriculumId}
                onChange={(e) => {
                  setActiveCurriculumId(e.target.value);
                  newChat();
                }}
                className="max-w-44 cursor-pointer appearance-none truncate rounded-full border border-card-border bg-card py-1.5 pl-3 pr-7 text-[11px] font-medium outline-none focus:border-accent"
              >
                {curricula.map((c) => (
                  <option key={c.curriculum_id} value={c.curriculum_id}>
                    {c.target_topic}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Restart conversation"
            title="New conversation"
            onClick={newChat}
          >
            <RefreshCw className="size-4" />
          </Button>
        </Card>

        {/* Messages */}
        <div className="scrollbar-thin mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto rounded-3xl border border-card-border bg-card/40 p-4 sm:p-5">
          {messages.length === 0 && !thinking && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              {activeModule ? (
                <>
                  <p className="text-sm font-medium">
                    Ready to be challenged on{" "}
                    <span className="text-accent">{activeModule.title}</span>?
                  </p>
                  <p className="max-w-xs text-xs leading-relaxed text-muted">
                    The Inquisitor will question your reasoning based on this
                    module. Pick a starting point:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border border-card-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Free-topic mode —{" "}
                    <span className="text-accent">learn anything</span>
                  </p>
                  <p className="max-w-sm text-xs leading-relaxed text-muted">
                    No module selected. Type any subject you&apos;re curious
                    about and The Inquisitor will guide you Socratically.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {FREE_STARTERS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border border-card-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "group flex animate-fade-up items-end gap-2.5",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {m.role === "inquisitor" && (
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    m.content.startsWith("⚠️")
                      ? "bg-orange-500/15 text-orange-500"
                      : "bg-accent text-white"
                  )}
                >
                  {m.content.startsWith("⚠️") ? (
                    <AlertTriangle className="size-3.5" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                </span>
              )}
              <div className="flex max-w-[85%] flex-col gap-1 sm:max-w-[75%]">
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-md bg-accent text-white"
                      : "rounded-bl-md border border-card-border bg-card"
                  )}
                >
                  {m.content ||
                    // Streaming placeholder dots before the first chunk lands.
                    "…"}
                </div>
                {m.role === "inquisitor" && m.hint && (
                  <div className="flex items-start gap-2 rounded-2xl border border-card-border bg-accent-soft px-3 py-2 text-xs leading-relaxed">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-accent" />
                    <span>
                      <span className="font-semibold">Hint: </span>
                      {m.hint}
                    </span>
                  </div>
                )}
                {/* Per-message actions (assistant only) */}
                {m.role === "inquisitor" && !m.content.startsWith("⚠️") && (
                  <div
                    className={cn(
                      "flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100",
                      speakingId === m.id && "opacity-100"
                    )}
                  >
                    <ActionIcon
                      label="Good answer"
                      active={feedback[m.id] === "up"}
                      onClick={() => rateMessage(m, "up")}
                    >
                      {feedback[m.id] === "up" ? (
                        <ThumbsUp className="size-3.5 fill-current" />
                      ) : (
                        <ThumbsUp className="size-3.5" />
                      )}
                    </ActionIcon>
                    <ActionIcon
                      label="Bad answer"
                      active={feedback[m.id] === "down"}
                      onClick={() => rateMessage(m, "down")}
                    >
                      {feedback[m.id] === "down" ? (
                        <ThumbsDown className="size-3.5 fill-current" />
                      ) : (
                        <ThumbsDown className="size-3.5" />
                      )}
                    </ActionIcon>
                    <ActionIcon
                      label={speakingId === m.id ? "Stop reading" : "Read aloud"}
                      active={speakingId === m.id}
                      onClick={() => toggleSpeak(m)}
                    >
                      {speakingId === m.id ? (
                        <VolumeX className="size-3.5" />
                      ) : (
                        <Volume2 className="size-3.5" />
                      )}
                    </ActionIcon>
                    {m.id === lastAssistantId && (
                      <ActionIcon
                        label="Regenerate answer"
                        onClick={regenerate}
                      >
                        <RefreshCw className="size-3.5" />
                      </ActionIcon>
                    )}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-citation-private/15 text-citation-private">
                  <User className="size-3.5" />
                </span>
              )}
            </div>
          ))}

          {thinking && (
            <div className="flex items-end gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                <Sparkles className="size-3.5" />
              </span>
              <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-md border border-card-border bg-card px-4 py-3.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 animate-pulse-dot rounded-full bg-muted"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <Card className="mt-3 flex shrink-0 items-end gap-2 p-2">
          <Button
            variant="secondary"
            size="icon"
            title="Request a hint"
            aria-label="Request a hint"
            onClick={() =>
              send(
                activeModule
                  ? `I'm stuck — give me a hint about ${activeModule.title}.`
                  : "I'm stuck — give me a hint about what we're discussing."
              )
            }
            disabled={thinking}
          >
            <Lightbulb className="size-4" />
          </Button>
          <Button
            variant={listening ? "primary" : "secondary"}
            size="icon"
            title={listening ? "Stop recording" : "Answer with your voice"}
            aria-label={listening ? "Stop recording" : "Voice input"}
            onClick={toggleListening}
            disabled={thinking}
            className={listening ? "animate-pulse-dot" : ""}
          >
            {listening ? <Square className="size-3.5" /> : <Mic className="size-4" />}
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={
              listening
                ? "Listening… speak now"
                : activeModule
                  ? "Answer with your reasoning… (Enter to send)"
                  : "Ask about anything you want to learn… (Enter to send)"
            }
            className="scrollbar-thin max-h-28 min-h-10 flex-1 resize-none self-center bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted"
          />
          <Button
            size="icon"
            aria-label="Send message"
            onClick={() => send()}
            disabled={thinking || !input.trim()}
          >
            <Send className="size-4" />
          </Button>
        </Card>
      </div>

      {/* History drawer (mobile) */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <aside
            className="absolute inset-y-0 right-0 flex w-[min(20rem,100vw)] flex-col bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pb-2 pt-5">
              <h2 className="text-sm font-semibold">History</h2>
              <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>
                Close
              </Button>
            </div>
            <div className="px-4 pb-3">
              <Button variant="secondary" size="sm" onClick={newChat} className="w-full justify-start gap-2 rounded-2xl">
                <Plus className="size-4" /> New chat
              </Button>
            </div>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-6">
              <SessionList
                sessions={sessions}
                curricula={curricula}
                activeFirstMessage={messages[0]?.content}
                onSelect={loadSession}
                onDelete={removeSession}
                onPin={togglePin}
              />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function ActionIcon({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded-full transition-colors",
        active
          ? "bg-accent-soft text-accent"
          : "text-muted hover:bg-tick-empty/50 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

/** Minimal, arena-style session list: plain rows with hover actions. */
function SessionList({
  sessions,
  curricula,
  activeFirstMessage,
  onSelect,
  onDelete,
  onPin,
}: {
  sessions: TutorSession[] | null;
  curricula: Curriculum[] | null;
  activeFirstMessage?: string;
  onSelect: (s: TutorSession) => void;
  onDelete: (e: React.MouseEvent, s: TutorSession) => void;
  onPin: (e: React.MouseEvent, s: TutorSession) => void;
}) {
  if (sessions === null) {
    return (
      <ul className="space-y-1 p-1">
        {[...Array(5)].map((_, i) => (
          <li
            key={i}
            className="skeleton h-9 w-full rounded-xl"
          />
        ))}
      </ul>
    );
  }
  if (sessions.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-[11px] leading-relaxed text-muted">
        No past sessions yet. Your conversations will appear here.
      </p>
    );
  }
  return (
    <ul className="space-y-0.5">
      {sessions.map((s) => {
        const firstUser = s.messages.find((m) => m.role === "user")?.content;
        const title =
          s.title?.trim() ||
          firstUser?.slice(0, 80) ||
          curricula?.find((c) => c.curriculum_id === s.curriculum_id)
            ?.target_topic ||
          "Free-topic chat";
        const isActive =
          activeFirstMessage !== undefined &&
          s.messages.some(
            (m) => m.role === "user" && m.content.slice(0, 80) === activeFirstMessage
          );
        return (
          <li key={s.session_key}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(s)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(s)}
              title={title}
              className={cn(
                "group flex cursor-pointer items-baseline gap-2 rounded-xl px-3 py-2 transition-colors",
                isActive ? "bg-accent-soft" : "hover:bg-tick-empty/40"
              )}
            >
              {s.pinned && (
                <Pin className="mt-0.5 size-3 shrink-0 rotate-45 text-accent" />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[13px] leading-snug",
                  isActive ? "font-medium text-accent" : "text-muted group-hover:text-foreground"
                )}
              >
                {title}
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                <span className="text-[10px] tabular-nums text-muted group-hover:hidden">
                  {relativeDay(s.started_at)}
                </span>
                <span className="hidden items-center group-hover:flex">
                  <button
                    type="button"
                    aria-label={s.pinned ? "Unpin conversation" : "Pin conversation"}
                    title={s.pinned ? "Unpin" : "Pin"}
                    onClick={(e) => onPin(e, s)}
                    className="flex size-6 items-center justify-center rounded-full text-muted hover:bg-accent-soft hover:text-accent"
                  >
                    {s.pinned ? (
                      <PinOff className="size-3" />
                    ) : (
                      <Pin className="size-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    title="Delete"
                    onClick={(e) => onDelete(e, s)}
                    className="flex size-6 items-center justify-center rounded-full text-muted hover:bg-red-500/10 hover:text-red-500"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
