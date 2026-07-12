import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { isDevelopmentFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ confirmed: z.boolean() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid age confirmation." }, { status: 400 });
  }
  const sessionId = (await cookies()).get("avasmoke_session")?.value;
  if (!sessionId && !isDevelopmentFallback) {
    return NextResponse.json({ error: "Session expired." }, { status: 401 });
  }
  if (!isDevelopmentFallback) {
    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Session service unavailable." }, { status: 503 });
    await admin
      .from("customer_sessions")
      .update({
        age_confirmed: parsed.data.confirmed,
        ended_at: parsed.data.confirmed ? null : new Date().toISOString(),
      })
      .eq("id", sessionId!);
  }
  return NextResponse.json({ accepted: parsed.data.confirmed });
}
