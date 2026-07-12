import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { explainRecommendations } from "@/lib/ai/services";
import { getStorefront } from "@/lib/data";
import { isDevelopmentFallback } from "@/lib/env";
import { topRecommendations } from "@/lib/recommendations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  storeSlug: z.string().min(1).max(120),
  qrCode: z.string().min(8).max(160),
  preferences: z.object({
    goal: z.string().max(80).optional(),
    flavorFamilies: z.array(z.string().max(40)).max(10),
    cooling: z.number().min(1).max(10).optional(),
    strength: z.number().min(1).max(10).optional(),
    budgetMin: z.number().nonnegative().optional(),
    budgetMax: z.number().positive().optional(),
    desiredPuffCount: z.number().positive().optional(),
    currentProductText: z.string().max(200).optional(),
  }),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preferences." }, { status: 400 });
  }

  const value = parsed.data;
  const storefront = await getStorefront(value.storeSlug, value.qrCode);
  if (!storefront) {
    return NextResponse.json({ error: "Store session is unavailable." }, { status: 404 });
  }

  const ranked = topRecommendations(storefront.inventory, value.preferences);
  const explanations = await explainRecommendations(ranked);
  const recommendations = ranked.map((result) => ({
    ...result,
    explanation:
      explanations.find((item) => item.productId === result.item.product.id)
        ?.explanation ??
      "One of the closest available matches at this store.",
  }));

  if (!isDevelopmentFallback && recommendations.length) {
    const sessionId = (await cookies()).get("avasmoke_session")?.value;
    const admin = createSupabaseAdminClient();
    if (sessionId && admin) {
      const { data: session } = await admin
        .from("customer_sessions")
        .select("id, shop_id, location_verified, age_confirmed")
        .eq("id", sessionId)
        .eq("shop_id", storefront.shop.id)
        .eq("location_verified", true)
        .eq("age_confirmed", true)
        .maybeSingle();
      if (!session) {
        return NextResponse.json({ error: "Verified session required." }, { status: 403 });
      }
      await admin.from("customer_preferences").upsert({
        session_id: session.id,
        preferred_flavor_families: value.preferences.flavorFamilies,
        cooling_preference: value.preferences.cooling ?? null,
        strength_preference: value.preferences.strength ?? null,
        budget_min: value.preferences.budgetMin ?? null,
        budget_max: value.preferences.budgetMax ?? null,
        desired_puff_count: value.preferences.desiredPuffCount ?? null,
      }, { onConflict: "session_id" });
      await admin.from("recommendations").insert(
        recommendations.map((result, index) => ({
          session_id: session.id,
          shop_id: storefront.shop.id,
          product_id: result.item.product.id,
          rank: index + 1,
          score: result.score,
          reason: result.explanation,
        })),
      );
    }
  }

  return NextResponse.json({ recommendations });
}
