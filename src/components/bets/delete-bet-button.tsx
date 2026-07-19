"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { deleteBet } from "@/actions/bets";

export function DeleteBetButton({ id }: { id: string }) {
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm(t("confirmDelete"))) {
          startTransition(() => deleteBet(id));
        }
      }}
      className="text-critical underline underline-offset-2 text-xs cursor-pointer disabled:opacity-50"
    >
      {t("delete")}
    </button>
  );
}
