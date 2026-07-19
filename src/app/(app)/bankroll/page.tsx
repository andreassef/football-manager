import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import { toNumber } from "@/lib/calculations";
import { formatCurrency } from "@/lib/currency";
import { Topbar } from "@/components/layout/topbar";
import { Card, PanelTitle, PanelNote, Eyebrow } from "@/components/ui/card";
import { BankrollForm } from "@/components/bankroll/bankroll-form";

export default async function BankrollPage() {
  const session = await getRequiredSession();
  const [t, tNav, locale, user, profitAgg] = await Promise.all([
    getTranslations("bankroll"),
    getTranslations("nav"),
    getLocale(),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.bet.aggregate({
      where: { userId: session.user.id, status: { not: "PENDING" } },
      _sum: { profit: true },
    }),
  ]);

  const initialBankroll = toNumber(user.initialBankroll) ?? 0;
  const initialUnits = user.initialUnits;
  const defaultStakeUnits = toNumber(user.defaultStakeUnits) ?? 1;
  const unitValue = initialUnits > 0 ? initialBankroll / initialUnits : 0;

  const totalProfit = toNumber(profitAgg._sum.profit) ?? 0;
  const currentBankroll = initialBankroll + totalProfit;
  const currentUnits = unitValue > 0 ? currentBankroll / unitValue : 0;

  const money = (v: number) => formatCurrency(v, "BRL", locale);

  return (
    <>
      <Topbar title={tNav("bankroll")} subtitle={t("subtitle")} />
      <div className="px-7 py-6 flex-1 flex flex-col gap-3.5 max-w-3xl">
        <Card>
          <PanelTitle>{t("currentSummary")}</PanelTitle>
          <PanelNote>{t("sinceStart")}</PanelNote>
          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <Eyebrow className="mb-1.5">{t("currentBankroll")}</Eyebrow>
              <div
                className="font-mono tabular-nums text-xl font-bold"
                style={{ color: totalProfit >= 0 ? "var(--good)" : "var(--critical)" }}
              >
                {money(currentBankroll)}
              </div>
            </div>
            <div>
              <Eyebrow className="mb-1.5">{t("currentUnits")}</Eyebrow>
              <div className="font-mono tabular-nums text-xl font-bold">{currentUnits.toFixed(1)}u</div>
            </div>
            <div>
              <Eyebrow className="mb-1.5">{t("unitValue")}</Eyebrow>
              <div className="font-mono tabular-nums text-xl font-bold">{money(unitValue)}</div>
            </div>
          </div>
        </Card>

        <Card>
          <PanelTitle>{tNav("bankroll")}</PanelTitle>
          <PanelNote>{t("subtitle")}</PanelNote>
          <BankrollForm
            initialBankroll={initialBankroll}
            initialUnits={initialUnits}
            defaultStakeUnits={defaultStakeUnits}
          />
        </Card>
      </div>
    </>
  );
}
