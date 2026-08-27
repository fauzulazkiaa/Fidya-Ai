"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { useApi } from "@/hooks/use-api";
import { useLocale } from "@/components/providers/locale-provider";
import { getCopy } from "@/lib/seo-copy";

function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(vars[key] ?? `{${key}}`)
  );
}

/**
 * Landing CTA that routes returning learners straight to their dashboard.
 * New visitors (or accounts with zero curricula) go to onboarding — and
 * returning users get a warm, polished welcome-back toast on arrival.
 */
export function StartCta({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const api = useApi();
  const { locale } = useLocale();
  const c = getCopy("start_cta", locale);
  const { toast } = useToast();
  const [href, setHref] = useState("/onboarding");
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    let cancelled = false;
    api
      .listCurricula()
      .then((list) => {
        if (!cancelled && list.length > 0) {
          setHref("/dashboard");
          const modulesDone = list.reduce(
            (n, c) =>
              n + c.modules.filter((m) => m.status === "completed").length,
            0
          );
          toast({
            tone: "accent",
            title: c.welcomeBack,
            desc:
              list.length === 1
                ? fill(c.oneCurriculum, {
                    topic: list[0].target_topic,
                    modulesDone,
                  })
                : fill(c.manyCurricula, {
                    count: list.length,
                    modulesDone,
                  }),
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [api, toast, c]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
