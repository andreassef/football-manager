"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, ReferenceLine, XAxis, YAxis, Tooltip } from "recharts";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/currency";
import { formatBucketLabel } from "@/lib/chart-labels";

export function ProfitChart({ data }: { data: { key: string; profit: number }[] }) {
  const t = useTranslations("dashboard");

  const chartData = data.map((d) => ({ ...d, label: formatBucketLabel(d.key) }));

  if (chartData.length === 0) {
    return <p className="text-xs text-text-3 py-8 text-center">{t("noData")}</p>;
  }

  const values = chartData.map((d) => d.profit);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const padding = Math.max(1, (max - min) * 0.1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10.5, fill: "var(--text-3)" }}
          axisLine={{ stroke: "var(--grid)" }}
          tickLine={false}
        />
        <YAxis
          domain={[min - padding, max + padding]}
          tick={{ fontSize: 10, fill: "var(--text-3)" }}
          axisLine={{ stroke: "var(--grid)" }}
          tickLine={false}
          width={56}
          tickFormatter={(v: number) => formatCurrency(v).replace(/,00$/, "")}
        />
        <ReferenceLine y={0} stroke="var(--text-3)" strokeDasharray="2 3" />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--text-1)",
          }}
        />
        <Bar dataKey="profit" radius={[2, 2, 0, 0]} isAnimationActive={false}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.profit >= 0 ? "var(--good)" : "var(--critical)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
