"use client";

import { useState } from "react";
import { KeyRound, Loader2, Send, Server, Terminal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/marketing/page-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { useApi } from "@/hooks/use-api";
import { getCopy } from "@/lib/seo-copy";

const BASE_URL = "https://fidya.ai/api/v1";
const AUTH_SNIPPET = `curl ${BASE_URL}/curriculum \\
  -H "Authorization: Bearer <token>"`;

const CONTACT_EMAIL = "support@fidya.ai";

export function ApiDocsContent() {
  const { locale } = useLocale();
  const c = getCopy("api_docs", locale);
  const api = useApi();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email.includes("@") || sending) return;
    setSending(true);
    const subject = `[API Access] ${name}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "Use case:",
      useCase,
      "",
      "— Sent from the api-docs page",
    ].join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    api.subscribeNewsletter(email, "api-docs").catch(() => {});
    setTimeout(() => setSending(false), 1500);
  }

  const inputClass =
    "h-10 w-full rounded-full border border-card-border bg-background px-4 text-xs outline-none transition-colors placeholder:text-muted focus:border-accent";

  return (
    <PageShell eyebrow={c.eyebrow} title={c.title} lead={c.lead}>
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Server className="size-4 text-accent" />
          {c.baseUrlLabel}
        </h2>
        <pre className="overflow-x-auto rounded-2xl border border-card-border bg-card p-4 font-mono text-xs text-muted">
          {BASE_URL}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <KeyRound className="size-4 text-accent" />
          {c.authTitle}
        </h2>
        <p className="text-sm leading-relaxed text-muted">{c.authDesc}</p>
        <pre className="overflow-x-auto rounded-2xl border border-card-border bg-card p-4 font-mono text-xs leading-relaxed text-foreground">
          {AUTH_SNIPPET}
        </pre>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Terminal className="size-4 text-accent" />
          {c.endpointsTitle}
        </h2>
        <Card className="divide-y divide-card-border overflow-hidden">
          {c.endpoints.map((ep) => (
            <div
              key={ep.path}
              className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={
                    ep.method === "GET"
                      ? "rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-[10px] font-bold text-accent"
                      : "rounded-full bg-citation-private/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-citation-private"
                  }
                >
                  {ep.method}
                </span>
                <code className="font-mono text-xs">{ep.path}</code>
              </span>
              <p className="text-xs text-muted sm:ml-auto sm:max-w-xs sm:text-right">
                {ep.desc}
              </p>
            </div>
          ))}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">{c.rateLimitTitle}</h2>
        <p className="text-sm leading-relaxed text-muted">{c.rateLimit}</p>
      </section>

      <Card className="flex flex-col gap-5 p-6">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <p className="text-sm font-semibold">{c.ctaTitle}</p>
            <p className="text-xs text-muted">{c.ctaDesc}</p>
          </div>
        </div>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted">
              {c.nameLabel}
            </span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={c.namePlaceholder}
              aria-label={c.nameLabel}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted">
              {c.emailLabel}
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={c.emailPlaceholder}
              aria-label={c.emailLabel}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-[11px] font-semibold text-muted">
              {c.useCaseLabel}
            </span>
            <textarea
              rows={3}
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder={c.useCasePlaceholder}
              aria-label={c.useCaseLabel}
              className="w-full resize-none rounded-2xl border border-card-border bg-background px-4 py-3 text-xs outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-80"
            >
              {sending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> {c.sending}
                </>
              ) : (
                <>
                  {c.sendRequest}
                  <Send className="size-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </PageShell>
  );
}
