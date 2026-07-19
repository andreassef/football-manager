"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { signInAction } from "@/lib/auth-actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const t = useTranslations();
  const [error, formAction, isPending] = useActionState(signInAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <Field label={t("auth.email")}>
        <Input type="email" name="email" required defaultValue="admin@marcador.local" />
      </Field>
      <Field label={t("auth.password")}>
        <Input type="password" name="password" required defaultValue="admin123" />
      </Field>
      {error && <p className="text-xs text-critical">{t("auth.signInError")}</p>}
      <Button type="submit" disabled={isPending} className="w-full mt-1">
        {t("auth.signIn")}
      </Button>
    </form>
  );
}
