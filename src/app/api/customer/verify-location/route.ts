import { NextResponse } from "next/server";
import { z } from "zod";

import { getStorefront } from "@/lib/data";
import { isDevelopmentFallback } from "@/lib/env";
import { verifyRadius } from "@/lib/location";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  storeSlug: z.string().min(1).max(120),
  qrCode: z.string().min(8).max(160),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  developmentTest: z.boolean().default(false),
  permissionStatus: z.enum(["granted", "denied", "unavailable"]).default("granted"),
}).refine(
  (value) =>
    value.developmentTest ||
    (value.latitude !== undefined && value.longitude !== undefined),
  "Coordinates are required.",
);

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid location request." }, { status: 400 });
  }

  const value = parsed.data;
  const storefront = await getStorefront(value.storeSlug, value.qrCode);
  if (!storefront || !storefront.qrCode.active || storefront.shop.status !== "active") {
    return NextResponse.json({ error: "This QR experience is unavailable." }, { status: 404 });
  }

  const radius =
    storefront.qrCode.scan_radius_override ??
    storefront.shop.allowed_radius_miles;
  if (value.developmentTest && !isDevelopmentFallback) {
    return NextResponse.json({ error: "Development test mode is unavailable." }, { status: 403 });
  }
  const customerCoordinates = value.developmentTest
    ? {
        latitude: storefront.shop.latitude,
        longitude: storefront.shop.longitude,
      }
    : { latitude: value.latitude!, longitude: value.longitude! };
  const result = verifyRadius(
    customerCoordinates,
    { latitude: storefront.shop.latitude, longitude: storefront.shop.longitude },
    radius,
  );
  const sessionId = crypto.randomUUID();

  if (!isDevelopmentFallback) {
    const admin = createSupabaseAdminClient();
    if (!admin) return NextResponse.json({ error: "Session service is unavailable." }, { status: 503 });
    const userAgent = request.headers.get("user-agent") ?? "";
    const { error: insertError } = await admin.from("customer_sessions").insert({
      id: sessionId,
      anonymous_session_id: crypto.randomUUID(),
      shop_id: storefront.shop.id,
      qr_code_id: storefront.qrCode.id,
      age_confirmed: false,
      location_permission_status: value.permissionStatus,
      location_verified: result.verified,
      distance_from_store_miles: result.distanceMiles,
      device_type: /mobile|android|iphone/i.test(userAgent) ? "mobile" : "desktop",
      referrer: request.headers.get("referer"),
    });
    if (insertError) {
      return NextResponse.json(
        { error: "The customer session could not be created." },
        { status: 503 },
      );
    }
  }

  const response = NextResponse.json({
    sessionId,
    verified: result.verified,
    distanceMiles: result.distanceMiles,
    radiusMiles: radius,
  });
  response.cookies.set("avasmoke_session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 4,
    path: "/",
  });
  return response;
}
