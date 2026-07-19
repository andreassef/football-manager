"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { createBet, updateBet } from "@/actions/bets";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/currency";

type Option = { id: string; name: string };
type MarketOption = { id: string; name: string; type: "TEAM" | "PLAYER" | "REFEREE" | "GENERAL" };
type PlayerOption = { id: string; name: string; teamName: string | null };

export type BetFormDefaults = {
  id?: string;
  marketId?: string;
  leagueId?: string;
  bookmakerId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  targetTeamId?: string;
  targetPlayerId?: string;
  refereeId?: string;
  totalFouls?: number;
  odds?: number;
  stake?: number;
  eventDate?: string;
  status?: "PENDING" | "WON" | "LOST" | "VOID";
  notes?: string;
};

export function BetForm({
  leagues,
  teams,
  bookmakers,
  markets,
  players,
  referees,
  defaults,
  suggestedStake,
  unitValue,
}: {
  leagues: Option[];
  teams: Option[];
  bookmakers: Option[];
  markets: MarketOption[];
  players: PlayerOption[];
  referees: Option[];
  defaults?: BetFormDefaults;
  /** Only used when creating a new bet (no `defaults`) — pre-fills Stake from the configured default stake unit. */
  suggestedStake?: number;
  /** Currency value of 1 unit, from Bankroll settings — drives the "≈ Xu" hint under Stake. */
  unitValue?: number;
}) {
  const t = useTranslations("betForm");
  const tStatus = useTranslations("betStatus");
  const tCommon = useTranslations("common");

  const [marketId, setMarketId] = useState(defaults?.marketId ?? markets[0]?.id ?? "");
  const [odds, setOdds] = useState(defaults?.odds ?? 1.85);
  const [stake, setStake] = useState(defaults?.stake ?? suggestedStake ?? 100);
  const [isPending, startTransition] = useTransition();

  const marketType = markets.find((m) => m.id === marketId)?.type ?? "GENERAL";

  const profitIfWon = useMemo(() => stake * (odds - 1), [stake, odds]);
  const roi = useMemo(() => (stake > 0 ? profitIfWon / stake : 0), [profitIfWon, stake]);

  async function action(formData: FormData) {
    formData.set("marketType", marketType);
    startTransition(async () => {
      const res = defaults?.id ? await updateBet(defaults.id, formData) : await createBet(formData);
      if (res?.error) {
        console.error(res.error);
      }
    });
  }

  return (
    <form action={action} className="grid grid-cols-2 gap-3.5 max-w-3xl">
      <Field label={t("league")}>
        <Select name="leagueId" required defaultValue={defaults?.leagueId}>
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("bookmaker")}>
        <Select name="bookmakerId" required defaultValue={defaults?.bookmakerId}>
          {bookmakers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("homeTeam")}>
        <Select name="homeTeamId" required defaultValue={defaults?.homeTeamId}>
          {teams.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t("awayTeam")}>
        <Select name="awayTeamId" required defaultValue={defaults?.awayTeamId}>
          {teams.map((tm) => (
            <option key={tm.id} value={tm.id}>
              {tm.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("market")} hint={t("marketHint")} className="col-span-2">
        <Select name="marketId" required value={marketId} onChange={(e) => setMarketId(e.target.value)}>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>

      {marketType === "TEAM" && (
        <Field label={t("targetTeam")} className="col-span-2 border-l-2 border-teal bg-teal-dim pl-3 py-2.5 pr-2.5">
          <Select name="targetTeamId" required defaultValue={defaults?.targetTeamId}>
            {teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {marketType === "PLAYER" && (
        <Field
          label={t("targetPlayer")}
          hint={t("targetPlayerHint")}
          className="col-span-2 border-l-2 border-teal bg-teal-dim pl-3 py-2.5 pr-2.5"
        >
          <Select name="targetPlayerId" required defaultValue={defaults?.targetPlayerId}>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.teamName ? `— ${p.teamName}` : ""}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {marketType === "REFEREE" && (
        <div className="col-span-2 border-l-2 border-teal bg-teal-dim pl-3 py-2.5 pr-2.5 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={t("referee")}>
              <Select name="refereeId" required defaultValue={defaults?.refereeId}>
                {referees.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("totalFouls")}>
              <Input type="number" name="totalFouls" min={0} required defaultValue={defaults?.totalFouls} />
            </Field>
          </div>
          <span className="text-[10.5px] text-text-3">{t("refereeHint")}</span>
        </div>
      )}

      {marketType === "GENERAL" && (
        <div className="col-span-2">
          <span className="text-[10.5px] text-text-3">{t("generalHint")}</span>
        </div>
      )}

      <Field label={t("odds")}>
        <Input
          type="number"
          name="odds"
          step="0.01"
          min="1.01"
          required
          value={odds}
          onChange={(e) => setOdds(parseFloat(e.target.value) || 0)}
        />
      </Field>
      <Field
        label={t("stake")}
        hint={unitValue && unitValue > 0 ? t("stakeInUnits", { units: (stake / unitValue).toFixed(2), unitValue: formatCurrency(unitValue) }) : undefined}
      >
        <Input
          type="number"
          name="stake"
          step="0.01"
          min="0.01"
          required
          value={stake}
          onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
        />
      </Field>

      <Field label={t("eventDate")}>
        <Input type="date" name="eventDate" required defaultValue={defaults?.eventDate} />
      </Field>
      <Field label={t("status")}>
        <Select name="status" defaultValue={defaults?.status ?? "PENDING"}>
          {(["PENDING", "WON", "LOST", "VOID"] as const).map((s) => (
            <option key={s} value={s}>
              {tStatus(s)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("notes")} className="col-span-2">
        <Textarea name="notes" rows={2} defaultValue={defaults?.notes} />
      </Field>

      <div className="col-span-2 bg-void-bg p-3.5 flex gap-8">
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-text-3">{t("profitIfWon")}</div>
          <div className="font-mono tabular-nums text-lg font-bold" style={{ color: "var(--good)" }}>
            {formatCurrency(profitIfWon)}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-text-3">{t("lossIfLost")}</div>
          <div className="font-mono tabular-nums text-lg font-bold" style={{ color: "var(--critical)" }}>
            {formatCurrency(-stake)}
          </div>
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-text-3">{t("potentialRoi")}</div>
          <div className="font-mono tabular-nums text-lg font-bold">{formatPercent(roi)}</div>
        </div>
      </div>

      <div className="col-span-2 flex gap-2.5">
        <Button type="submit" disabled={isPending}>
          {tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
