"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, localeCookieName } from "@/i18n/locales";

export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set(localeCookieName, locale, { maxAge: 60 * 60 * 24 * 365, path: "/" });
  revalidatePath("/");
}
