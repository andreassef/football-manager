import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/** Edge-safe auth() for middleware — no Credentials/bcrypt/Prisma in this bundle. */
export const { auth } = NextAuth(authConfig);
