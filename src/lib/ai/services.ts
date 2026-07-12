import "server-only";

import { generateText, Output } from "ai";
import { z } from "zod";

import type { InventoryItem, ScoredRecommendation } from "@/lib/types";
import {
  AI_GROUNDING_RULES,
  getAiMode,
  getLanguageModel,
} from "@/lib/ai/provider";

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
      explanation: z.string().max(180),
    }),
  );
  const { output } = await generateText({
    model,
    output: Output.object({ schema }),
    system: AI_GROUNDING_RULES,
    prompt: `Explain these already-scored recommendations in one short sentence each. Do not change the ranking.\n${JSON.stringify(
      recommendations.map(({ item, score, reasons }) => ({
        productId: item.product.id,
        product: item.product,
        price: item.sale_price ?? item.price,
        stock: item.stock_status,
        score,
        reasons,
      })),
    )}`,
  });
  return output;
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

  const { text } = await generateText({
    model,
    system: AI_GROUNDING_RULES,
    prompt: `CURRENT_STORE_INVENTORY:\n${JSON.stringify(
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
  return { mode: "live" as const, answer: text };
}
