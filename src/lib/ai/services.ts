import "server-only";

import { generateText, Output } from "ai";
import { z } from "zod";

import type { InventoryItem, ScoredRecommendation } from "@/lib/types";
import {
  AI_GROUNDING_RULES,
  getAiMode,
  getLanguageModel,
} from "@/lib/ai/provider";
import { formatCurrency } from "@/lib/utils";

export const extractedProductSchema = z.object({
  brand: z.string().nullable(),
  productLine: z.string().nullable(),
  flavor: z.string().nullable(),
  puffCount: z.number().int().positive().nullable(),
  nicotinePercentage: z.number().nonnegative().nullable(),
  deviceType: z.string().nullable(),
  rechargeable: z.boolean().nullable(),
  visibleClaims: z.array(z.string()),
  packagingColor: z.string().nullable(),
  category: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  uncertaintyNotes: z.array(z.string()),
});

export type ExtractedProduct = z.infer<typeof extractedProductSchema>;

export async function extractProductsFromImages(imageUrls: string[]) {
  const model = getLanguageModel();
  if (!model || getAiMode() === "mock") {
    return {
      mode: "mock" as const,
      products: imageUrls.map<ExtractedProduct>((_, index) => ({
        brand: null,
        productLine: `Review required ${index + 1}`,
        flavor: null,
        puffCount: null,
        nicotinePercentage: null,
        deviceType: null,
        rechargeable: null,
        visibleClaims: [],
        packagingColor: null,
        category: "Disposable",
        confidence: 0,
        uncertaintyNotes: [
          "Mock mode is active. Configure a server-side AI provider to analyze this image.",
        ],
      })),
    };
  }

  const safeUrls = imageUrls.map((value) => {
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("Images must use HTTPS.");
    return url;
  });

  const { output } = await generateText({
    model,
    output: Output.array({ element: extractedProductSchema }),
    maxOutputTokens: 1800,
    abortSignal: AbortSignal.timeout(30_000),
    system:
      "Extract only packaging details clearly visible in the supplied retail product images. Never infer uncertain specifications. Return one record per identifiable product.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Identify each visible product. Shelf images may contain multiple products.",
          },
          ...safeUrls.map((url) => ({
            type: "file" as const,
            mediaType: "image" as const,
            data: { type: "url" as const, url },
          })),
        ],
      },
    ],
  });

  return { mode: "live" as const, products: output };
}

export async function explainRecommendations(
  recommendations: ScoredRecommendation[],
) {
  const model = getLanguageModel();
  if (!model || getAiMode() === "mock") {
    return recommendations.map((result) => ({
      productId: result.item.product.id,
      explanation: result.reasons.length
        ? `A close match because it ${result.reasons.join(", ")}.`
        : "This is one of the closest available matches at this store.",
    }));
  }

  const schema = z.array(
    z.object({
      productId: z.string(),
      reasonIndexes: z.array(z.number().int().nonnegative()).max(3),
    }),
  );
  const { output } = await generateText({
    model,
    output: Output.object({ schema }),
    system: AI_GROUNDING_RULES,
    maxOutputTokens: 300,
    abortSignal: AbortSignal.timeout(15_000),
    prompt: `Select up to three supplied reason indexes for each product. Never write prose and do not change product IDs.\n${JSON.stringify(
      recommendations.map(({ item, reasons }) => ({
        productId: item.product.id,
        reasons,
      })),
    )}`,
  });
  return recommendations.map((result) => {
    const selected = output.find(
      (item) => item.productId === result.item.product.id,
    );
    const reasons = (selected?.reasonIndexes ?? [0, 1, 2])
      .map((index) => result.reasons[index])
      .filter((reason): reason is string => Boolean(reason));
    return {
      productId: result.item.product.id,
      explanation: reasons.length
        ? `A close match because it ${reasons.join(", ")}.`
        : "This is one of the closest available matches at this store.",
    };
  });
}

export async function answerInventoryQuestion(
  question: string,
  inventory: InventoryItem[],
) {
  const available = inventory.filter(
    (item) =>
      item.product.active &&
      ["in_stock", "low_stock"].includes(item.stock_status),
  );
  const model = getLanguageModel();
  if (!model || getAiMode() === "mock") {
    const first = available[0];
    return {
      mode: "mock" as const,
      answer: first
        ? `Mock mode: ${first.product.brand_name} ${first.product.flavor_name} is available. Use Find My Match for grounded ranking.`
        : "No available inventory was found.",
    };
  }

  const selectionSchema = z.object({
    selectedProductIds: z.array(z.string()).max(3),
    followUpQuestion: z.string().max(100).nullable(),
  });
  const { output } = await generateText({
    model,
    output: Output.object({ schema: selectionSchema }),
    system: AI_GROUNDING_RULES,
    maxOutputTokens: 250,
    abortSignal: AbortSignal.timeout(15_000),
    prompt: `Select up to three product IDs that answer the question. Return only IDs from the supplied inventory. If essential preference information is missing, return a short follow-up question and no IDs.\nCURRENT_STORE_INVENTORY:\n${JSON.stringify(
      available.map((item) => ({
        id: item.product.id,
        brand: item.product.brand_name,
        name: item.product.product_name,
        flavor: item.product.flavor_name,
        price: item.sale_price ?? item.price,
        stock: item.stock_status,
        cooling: item.product.cooling_level,
        sweetness: item.product.sweetness_level,
        strength: item.product.hit_strength,
        puffs: item.product.puff_count,
      })),
    )}\n\nCUSTOMER QUESTION: ${question}`,
  });
  const allowedIds = new Set(available.map((item) => item.product.id));
  const selected = output.selectedProductIds
    .filter((id) => allowedIds.has(id))
    .map((id) => available.find((item) => item.product.id === id))
    .filter((item): item is InventoryItem => Boolean(item));
  if (!selected.length) {
    return {
      mode: "live" as const,
      answer:
        output.followUpQuestion ??
        "I could not find a supported match in this store’s available inventory.",
    };
  }
  const lines = selected.map((item) => {
    const details = [
      formatCurrency(item.sale_price ?? item.price),
      item.product.puff_count
        ? `${item.product.puff_count.toLocaleString()} puffs`
        : null,
      item.product.cooling_level
        ? `cooling ${item.product.cooling_level}/10`
        : null,
      item.stock_status === "low_stock" ? "low stock" : "in stock",
    ].filter(Boolean);
    return `${item.product.brand_name} ${item.product.flavor_name ?? item.product.product_name} — ${details.join(", ")}`;
  });
  return {
    mode: "live" as const,
    answer: `Closest available option${lines.length > 1 ? "s" : ""}: ${lines.join("; ")}.`,
  };
}
