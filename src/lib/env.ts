import "server-only";

import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.enum(["openai", "anthropic", "mock"]).default("mock"),
  AI_MODEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  ENABLE_DEVELOPMENT_FALLBACK: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const parsed = serverSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
  AI_MODEL: process.env.AI_MODEL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  ENABLE_DEVELOPMENT_FALLBACK: process.env.ENABLE_DEVELOPMENT_FALLBACK,
});

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

export const env = parsed.data;
export const isSupabaseConfigured = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
export const isDevelopmentFallback =
  !isSupabaseConfigured &&
  (process.env.NODE_ENV !== "production" || env.ENABLE_DEVELOPMENT_FALLBACK);
