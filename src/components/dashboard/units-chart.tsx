"use client";

import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import { formatBucketLabel } from "@/lib/chart-labels";

export function UnitsChart({
  data,
  initialUnits,
}: {
  data: { key: string; cumulativeUnits: number | null }[];
  initialUnits: number;
}) {
  const t = useTranslations("dashboard");

  const chartData = data
    .filter((d): d is { key: string; cumulativeUnits: number } => d.cumulativeUnits !== null)
    .map((d) => ({ ...d, label: formatBucketLabel(d.key) }));

  if (chartData.length === 0) {
    return <p className="text-xs text-text-3 py-8 text-center">{t("noUnitsData")}</p>;
  }

  const values = chartData.map((d) => d.cumulativeUnits);
  const min = Math.min(initialUnits, ...values);
  const max = Math.max(initialUnits, ...values);
  const padding = Math.max(1, (max - min) * 0.15);
  const last = chartData[chartData.length - 1];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="unitsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--teal)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--teal)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          width={44}
          tickFormatter={(v: number) => `${v.toFixed(0)}u`}
        />
        <ReferenceLine y={initialUnits} stroke="var(--text-3)" strokeDasharray="2 3" />
        <Tooltip
          formatter={(value) => `${Number(value).toFixed(2)}u`}
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--text-1)",
          }}
        />
        <Area
          type="monotone"
          dataKey="cumulativeUnits"
          stroke="var(--teal)"
          strokeWidth={2}
          fill="url(#unitsFill)"
          isAnimationActive={false}
          dot={(props) => {
            const isLast = props.payload.key === last.key;
            return (
              <circle
                key={props.payload.key}
                cx={props.cx}
                cy={props.cy}
                r={isLast ? 4.5 : 2.6}
                fill="var(--teal)"
                stroke="var(--card)"
                strokeWidth={isLast ? 2 : 1}
              />
            );
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
