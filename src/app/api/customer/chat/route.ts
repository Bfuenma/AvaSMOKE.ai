import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { answerInventoryQuestion } from "@/lib/ai/services";
import { getStorefront } from "@/lib/data";
import { isDevelopmentFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  storeSlug: z.string().min(1).max(120),
  qrCode: z.string().min(8).max(160),
  message: z.string().trim().min(2).max(600),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a shorter product question." }, { status: 400 });
  }
  const storefront = await getStorefront(parsed.data.storeSlug, parsed.data.qrCode);
  if (!storefront) return NextResponse.json({ error: "Store session unavailable." }, { status: 404 });

  const sessionId = (await cookies()).get("avasmoke_session")?.value;
  const admin = isDevelopmentFallback ? null : createSupabaseAdminClient();
  if (!isDevelopmentFallback) {
    if (!sessionId || !admin) return NextResponse.json({ error: "Session expired." }, { status: 401 });
    const { data: session } = await admin
      .from("customer_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("shop_id", storefront.shop.id)
      .eq("location_verified", true)
      .eq("age_confirmed", true)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: "Verified session required." }, { status: 403 });
  }

  const result = await answerInventoryQuestion(parsed.data.message, storefront.inventory);
  if (admin && sessionId) {
    await admin.from("conversations").insert([
      { session_id: sessionId, shop_id: storefront.shop.id, role: "customer", message: parsed.data.message },
      { session_id: sessionId, shop_id: storefront.shop.id, role: "assistant", message: result.answer, metadata: { mode: result.mode } },
    ]);
  }
  return NextResponse.json(result);
}
