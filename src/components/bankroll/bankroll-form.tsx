"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateBankrollSettings } from "@/actions/bankroll";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";

export function BankrollForm({
  initialBankroll,
  initialUnits,
  defaultStakeUnits,
}: {
  initialBankroll: number;
  initialUnits: number;
  defaultStakeUnits: number;
}) {
  const t = useTranslations("bankroll");
  const tCommon = useTranslations("common");
  const [bankroll, setBankroll] = useState(initialBankroll);
  const [units, setUnits] = useState(initialUnits);
  const [stakeUnits, setStakeUnits] = useState(defaultStakeUnits);
  const [isPending, startTransition] = useTransition();

  const unitValue = useMemo(() => (units > 0 ? bankroll / units : 0), [bankroll, units]);

  return (
    <form
      action={(formData) => startTransition(async () => { await updateBankrollSettings(formData); })}
      className="flex flex-col gap-3.5 max-w-md"
    >
      <Field label={t("initialBankroll")} hint={t("initialBankrollHint")}>
        <Input
          type="number"
          name="initialBankroll"
          step="0.01"
          min="0"
          required
          value={bankroll}
          onChange={(e) => setBankroll(parseFloat(e.target.value) || 0)}
        />
      </Field>

      <Field label={t("initialUnits")} hint={t("initialUnitsHint")}>
        <Input
          type="number"
          name="initialUnits"
          step="1"
          min="1"
          required
          value={units}
          onChange={(e) => setUnits(parseInt(e.target.value, 10) || 0)}
        />
      </Field>

      <Field label={t("defaultStakeUnits")} hint={t("defaultStakeUnitsHint")}>
        <Input
          type="number"
          name="defaultStakeUnits"
          step="0.1"
          min="0.1"
          required
          value={stakeUnits}
          onChange={(e) => setStakeUnits(parseFloat(e.target.value) || 0)}
        />
      </Field>

      <div className="bg-void-bg p-3.5 flex justify-between items-center">
        <span className="text-[11px] uppercase tracking-wide text-text-3">{t("unitValue")}</span>
        <span className="font-mono tabular-nums text-base font-bold">{formatCurrency(unitValue)}</span>
      </div>

      <Button type="submit" disabled={isPending} className="self-start">
        {tCommon("save")}
      </Button>
    </form>
  );
}
