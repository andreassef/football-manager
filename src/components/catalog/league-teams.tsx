"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { addTeamToLeague, removeTeamFromLeague } from "@/actions/leagues";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/field";

export function LeagueTeamsClient({
  leagueId,
  teams,
  availableTeams,
  detailBase,
}: {
  leagueId: string;
  teams: { id: string; name: string }[];
  availableTeams: { id: string; name: string }[];
  detailBase: string;
}) {
  const t = useTranslations("common");
  const tc = useTranslations("catalog");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-[11.5px] text-text-3">{tc("teamsInLeagueHint")}</p>

      <div className="bg-card border border-border">
        <table className="w-full text-[12.5px] border-collapse">
          <tbody>
            {teams.length === 0 && (
              <tr>
                <td className="p-4 text-text-3">{t("empty")}</td>
              </tr>
            )}
            {teams.map((tm) => (
              <tr key={tm.id} className="border-b border-grid last:border-0">
                <td className="p-2.5">
                  <Link href={`${detailBase}/${tm.id}`} className="text-teal underline underline-offset-2">
                    {tm.name}
                  </Link>
                </td>
                <td className="p-2.5 text-right whitespace-nowrap">
                  <button
                    onClick={() => startTransition(async () => { await removeTeamFromLeague(leagueId, tm.id); })}
                    className="text-critical underline underline-offset-2 text-xs cursor-pointer"
                  >
                    {t("delete")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {availableTeams.length > 0 && (
        <form
          action={(formData) => startTransition(async () => { await addTeamToLeague(leagueId, formData); })}
          className="bg-card border border-border p-4 flex flex-wrap gap-3 items-end"
        >
          <Field label={tc("teams")}>
            <Select name="teamId" required>
              {availableTeams.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={isPending}>
            + {t("add")}
          </Button>
        </form>
      )}
    </div>
  );
}
