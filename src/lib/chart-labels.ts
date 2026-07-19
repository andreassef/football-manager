/** Formats an evolution-chart bucket key ("YYYY-MM-DD" or "YYYY-MM") into a short axis label. */
export function formatBucketLabel(key: string): string {
  const parts = key.split("-").map(Number);
  const isDaily = parts.length === 3;
  const [y, m, day] = parts;
  if (isDaily) return String(day);
  return (
    new Date(Date.UTC(y, m - 1, 1))
      .toLocaleDateString(undefined, { month: "short", timeZone: "UTC" })
      .replace(/\.$/, "") + `/${String(y).slice(-2)}`
  );
}
