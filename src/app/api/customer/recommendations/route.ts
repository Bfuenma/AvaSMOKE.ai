import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { explainRecommendations } from "@/lib/ai/services";
import { getStorefront, toCustomerInventory } from "@/lib/data";
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
  const sessionId = (await cookies()).get("avasmoke_session")?.value;
  const admin = isDevelopmentFallback ? null : createSupabaseAdminClient();
  if (!isDevelopmentFallback && (!sessionId || !admin)) {
    return NextResponse.json({ error: "Verified session required." }, { status: 401 });
  }
  const storefront = await getStorefront(value.storeSlug, value.qrCode);
  if (!storefront) {
    return NextResponse.json({ error: "Store session is unavailable." }, { status: 404 });
  }

  let verifiedSessionId: string | undefined;
  if (admin && sessionId) {
    const expiresAfter = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: session } = await admin
      .from("customer_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("shop_id", storefront.shop.id)
      .eq("qr_code_id", storefront.qrCode.id)
      .eq("location_verified", true)
      .eq("age_confirmed", true)
      .is("ended_at", null)
      .gte("started_at", expiresAfter)
      .maybeSingle();
    if (!session) {
      return NextResponse.json({ error: "Verified session required." }, { status: 403 });
    }
    const { count } = await admin
      .from("recommendations")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id);
    if ((count ?? 0) >= 60) {
      return NextResponse.json(
        { error: "Recommendation limit reached for this session." },
        { status: 429 },
      );
    }
    verifiedSessionId = session.id;
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

  if (admin && verifiedSessionId && recommendations.length) {
    const preferenceResult = await admin.from("customer_preferences").upsert({
        session_id: verifiedSessionId,
        preferred_flavor_families: value.preferences.flavorFamilies,
        cooling_preference: value.preferences.cooling ?? null,
        strength_preference: value.preferences.strength ?? null,
        budget_min: value.preferences.budgetMin ?? null,
        budget_max: value.preferences.budgetMax ?? null,
        desired_puff_count: value.preferences.desiredPuffCount ?? null,
      }, { onConflict: "session_id" });
    const recommendationResult = await admin.from("recommendations").insert(
        recommendations.map((result, index) => ({
          session_id: verifiedSessionId,
          shop_id: storefront.shop.id,
          product_id: result.item.product.id,
          rank: index + 1,
          score: result.score,
          reason: result.explanation,
        })),
      );
    if (preferenceResult.error || recommendationResult.error) {
      return NextResponse.json(
        { error: "Recommendations could not be recorded." },
        { status: 503 },
      );
    }
  }

  const customerItems = toCustomerInventory(
    recommendations.map((result) => result.item),
  );
  return NextResponse.json({
    recommendations: recommendations.map((result, index) => ({
      ...result,
      item: customerItems[index],
    })),
  });
}
