import "server-only";

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

import { env } from "@/lib/env";

export function getAiMode() {
  if (env.AI_PROVIDER === "openai" && env.OPENAI_API_KEY && env.AI_MODEL) {
    return "live" as const;
  }
  if (
    env.AI_PROVIDER === "anthropic" &&
    env.ANTHROPIC_API_KEY &&
    env.AI_MODEL
  ) {
    return "live" as const;
  }
  return "mock" as const;
}

export function getLanguageModel() {
  if (env.AI_PROVIDER === "openai" && env.OPENAI_API_KEY && env.AI_MODEL) {
    return createOpenAI({ apiKey: env.OPENAI_API_KEY })(env.AI_MODEL);
  }
  if (
    env.AI_PROVIDER === "anthropic" &&
    env.ANTHROPIC_API_KEY &&
    env.AI_MODEL
  ) {
    return createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })(env.AI_MODEL);
  }
  return null;
}

export const AI_GROUNDING_RULES = `You are AvaSmoke.Ai, a concise adult-only retail product assistant.
- Recommend only products supplied in CURRENT_STORE_INVENTORY.
- Never invent products, prices, specifications, availability, or performance.
- If data is missing, say it is unavailable.
- Do not make health or safety claims or provide medical advice.
- Never claim that vaping is harmless or a smoking-cessation treatment.
- Do not market to minors or encourage excessive consumption.
- Mention low stock when applicable.
- Keep answers brief, factual, and customer-friendly.`;
