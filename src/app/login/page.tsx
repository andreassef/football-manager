import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/login-form";
import { LocaleToggle } from "@/components/layout/locale-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function LoginPage() {
  const t = await getTranslations();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-end gap-2.5 p-5">
        <LocaleToggle />
        <ThemeToggle />
      </div>
      <div className="flex-1 flex items-center justify-center pb-20">
        <div className="w-[340px] bg-card border border-border p-8">
          <div className="flex items-center gap-2 pb-5">
            <span className="w-3 h-4 bg-warning shrink-0" />
            <span className="font-extrabold text-base uppercase tracking-wide">{t("brand.name")}</span>
          </div>
          <LoginForm />
          <p className="text-[11px] text-text-3 mt-4 text-center leading-relaxed">
            {t("auth.restrictedNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
