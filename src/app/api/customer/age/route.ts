import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getStorefront, toCustomerInventory } from "@/lib/data";
import { isDevelopmentFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  confirmed: z.boolean(),
  storeSlug: z.string().min(1).max(120),
  qrCode: z.string().min(8).max(160),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid age confirmation." }, { status: 400 });
  }
  const storefront = await getStorefront(
    parsed.data.storeSlug,
    parsed.data.qrCode,
  );
  if (!storefront) {
    return NextResponse.json({ error: "Store session unavailable." }, { status: 404 });
  }
  const sessionId = (await cookies()).get("avasmoke_session")?.value;
  if (!sessionId && !isDevelopmentFallback) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }
  if (!isDevelopmentFallback) {
    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Session service unavailable." }, { status: 503 });
    const expiresAfter = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: session, error } = await admin
      .from("customer_sessions")
      .update({
        age_confirmed: parsed.data.confirmed,
        ended_at: parsed.data.confirmed ? null : new Date().toISOString(),
      })
      .eq("id", sessionId!)
      .eq("shop_id", storefront.shop.id)
      .eq("qr_code_id", storefront.qrCode.id)
      .eq("location_verified", true)
      .is("ended_at", null)
      .gte("started_at", expiresAfter)
      .select("id")
      .maybeSingle();
    if (error || !session) {
      return NextResponse.json(
        { error: "Verified location session required." },
        { status: 403 },
      );
    }
  }
  return NextResponse.json({
    accepted: parsed.data.confirmed,
    inventory: parsed.data.confirmed
      ? toCustomerInventory(storefront.inventory)
      : [],
  });
}
