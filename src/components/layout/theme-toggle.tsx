"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Standard next-themes pattern: resolvedTheme is unknown on the server, so we
    // render the theme-dependent icon/label only after client mount to avoid a
    // hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-1.5 border border-border rounded-full px-3 py-1.5 text-xs font-semibold text-text-2 hover:border-teal hover:text-text-1 cursor-pointer"
    >
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="1.7">
        {isDark ? (
          <path d="M13 8.6A5.4 5.4 0 0 1 7.4 3 5.4 5.4 0 1 0 13 8.6Z" />
        ) : (
          <>
            <circle cx="8" cy="8" r="3.2" />
            <path d="M8 1.6v1.6M8 12.8v1.6M14.4 8H12.8M3.2 8H1.6M12.4 3.6l-1.1 1.1M4.7 11.3l-1.1 1.1M12.4 12.4l-1.1-1.1M4.7 4.7 3.6 3.6" />
          </>
        )}
      </svg>
      {mounted ? (isDark ? t("theme.dark") : t("theme.light")) : ""}
    </button>
  );
}
