import { getTranslations } from "next-intl/server";
import { LocaleToggle } from "@/components/layout/locale-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signOutAction } from "@/lib/auth-actions";

export async function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const t = await getTranslations("nav");
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-7 py-3.5 bg-paper/90 backdrop-blur border-b border-border">
      <div>
        <h1 className="text-[19px] font-bold tracking-tight m-0">{title}</h1>
        {subtitle && <div className="text-xs text-text-3 mt-0.5">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2.5">
        <LocaleToggle />
        <ThemeToggle />
        <form action={signOutAction}>
          <button className="text-xs font-semibold text-text-2 hover:text-critical px-3 py-1.5 cursor-pointer">
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
