"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";

interface Spark {
  concept: string;
  from_domain: string;
  to_domain: string;
  insight: string;
}

export function CatalystCard({ concept }: { concept?: string }) {
  const api = useApi();
  const [spark, setSpark] = useState<Spark | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function ignite(topic?: string) {
    if (!topic) return;
    setLoading(true);
    setFailed(false);
    try {
      const res = await api.catalystSpark(topic);
      setSpark(res.spark);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!concept || spark || failed) return;
    let cancelled = false;
    api
      .catalystSpark(concept)
      .then((res) => {
        if (!cancelled) setSpark(res.spark);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept]);

  return (
    <Card className="relative overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-accent-soft blur-2xl"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent text-white">
            <Lightbulb className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Catalyst Spark</h3>
            <p className="text-[11px] text-muted">
              Cross-disciplinary analogies for deeper intuition
            </p>
          </div>
        </div>
        {concept && (
          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={() => ignite(concept)}
            aria-label="Generate new analogy"
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            New spark
          </Button>
        )}
      </div>

      {!concept ? (
        <p className="mt-5 rounded-2xl bg-background p-4 text-xs leading-relaxed text-muted">
          Generate your first curriculum and The Catalyst will map its concepts
          to unexpected domains — biology, music, city planning — to deepen
          your intuition.
        </p>
      ) : !spark && !failed ? (
        <div className="mt-5 space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-4 w-3/5" />
        </div>
      ) : spark ? (
        <ul className="mt-5">
          <li className="rounded-2xl bg-background p-4">
            <p className="text-[13px] leading-relaxed">{spark.insight}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
              <Badge tone="accent">{spark.from_domain}</Badge>
              <span>→</span>
              <Badge tone="accent">{spark.to_domain}</Badge>
            </div>
          </li>
        </ul>
      ) : failed ? (
        <p className="mt-5 rounded-2xl bg-background p-4 text-xs leading-relaxed text-muted">
          Couldn&apos;t reach The Catalyst right now. Try again in a moment.
        </p>
      ) : null}
    </Card>
  );
}
