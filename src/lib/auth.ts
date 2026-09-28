import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { createAuthHooks } from "./auth-hooks";

const hooks = createAuthHooks(db);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  // El puerto 3100 es el que usan los e2e (playwright.config.ts) para no
  // chocar con lo que ya esté sirviendo el 3000 en la máquina de desarrollo.
  trustedOrigins:
    process.env.NODE_ENV === "production" ? undefined : ["http://localhost:3000", "http://localhost:3100"],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          await hooks.beforeUserCreate(user);
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          await hooks.beforeSessionCreate(session);
        },
      },
    },
  },
});
