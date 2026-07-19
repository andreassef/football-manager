"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setLocaleAction } from "@/lib/locale-actions";

export function LocaleToggle() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = locale === "pt-BR" ? "en" : "pt-BR";
    startTransition(() => {
      setLocaleAction(next);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1.5 border border-border rounded-full px-3 py-1.5 text-xs font-semibold text-text-2 hover:border-teal hover:text-text-1 cursor-pointer disabled:opacity-60"
    >
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="1.7">
        <circle cx="8" cy="8" r="6.2" />
        <path d="M2 8h12M8 1.8c2 2 2 10.4 0 12.4M8 1.8c-2 2-2 10.4 0 12.4" />
      </svg>
      {locale === "pt-BR" ? "PT-BR" : "EN"}
    </button>
  );
}
