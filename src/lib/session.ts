import { auth } from "@/lib/auth";

/** Throws if there is no authenticated session — use in Server Actions/pages that require a user. */
export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHENTICATED");
  }
  return session;
}
