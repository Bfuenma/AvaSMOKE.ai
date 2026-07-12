import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { extractProductsFromImages } from "@/lib/ai/services";
import { getStorefront, toCustomerInventory } from "@/lib/data";
import { isDevelopmentFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeSearchText } from "@/lib/utils";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const image = formData.get("image");
  const storeSlug = String(formData.get("storeSlug") ?? "");
  const qrCode = String(formData.get("qrCode") ?? "");
  if (
    !(image instanceof File) ||
    !ALLOWED_TYPES.has(image.type) ||
    image.size > MAX_FILE_BYTES
  ) {
    return NextResponse.json({ error: "Upload one JPEG, PNG, or WebP image under 8 MB." }, { status: 400 });
  }

  const sessionId = (await cookies()).get("avasmoke_session")?.value;
  const admin = isDevelopmentFallback ? null : createSupabaseAdminClient();
  if (!isDevelopmentFallback && (!sessionId || !admin)) {
    return NextResponse.json({ error: "Verified session required." }, { status: 401 });
  }
  const storefront = await getStorefront(storeSlug, qrCode);
  if (!storefront) {
    return NextResponse.json({ error: "Store session unavailable." }, { status: 404 });
  }

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
      .from("product_requests")
      .select("id", { count: "exact", head: true })
      .eq("session_id", session.id)
      .eq("source", "photo");
    if ((count ?? 0) >= 10) {
      return NextResponse.json({ error: "Photo-search limit reached for this session." }, { status: 429 });
    }
  }

  let imageUrl = `https://development.invalid/${encodeURIComponent(image.name)}`;
  let uploadedPath: string | undefined;
  if (admin && sessionId) {
    const extension = image.type.split("/")[1] ?? "jpg";
    uploadedPath = `${sessionId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await admin.storage
      .from("customer-searches")
      .upload(uploadedPath, image, { contentType: image.type, upsert: false });
    if (error) {
      return NextResponse.json({ error: "The image could not be processed." }, { status: 503 });
    }
    const signed = await admin.storage
      .from("customer-searches")
      .createSignedUrl(uploadedPath, 300);
    if (!signed.data?.signedUrl) {
      await admin.storage.from("customer-searches").remove([uploadedPath]);
      return NextResponse.json({ error: "The image could not be processed." }, { status: 503 });
    }
    imageUrl = signed.data.signedUrl;
  }

  try {
    const extraction = await extractProductsFromImages([imageUrl]);
    const product = extraction.products[0];
    const search = normalizeSearchText(
      product?.brand,
      product?.productLine,
      product?.flavor,
    );
    const words = new Set(search.split(" ").filter(Boolean));
    const ranked = storefront.inventory
      .filter((item) => item.product.active && ["in_stock", "low_stock"].includes(item.stock_status))
      .map((item) => {
        const candidate = normalizeSearchText(
          item.product.brand_name,
          item.product.product_name,
          item.product.flavor_name,
          item.product.flavor_family,
        );
        const overlap = candidate.split(" ").filter((word) => words.has(word)).length;
        return { item, overlap };
      })
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3);

    if (admin && sessionId) {
      const { error } = await admin.from("product_requests").insert({
        session_id: sessionId,
        shop_id: storefront.shop.id,
        requested_brand: product?.brand ?? null,
        requested_product: product?.productLine ?? null,
        requested_flavor: product?.flavor ?? null,
        request_details: `Photo confidence ${product?.confidence ?? 0}`,
        matching_product_found: Boolean(ranked[0]?.overlap),
        source: "photo",
      });
      if (error) {
        return NextResponse.json({ error: "Photo search could not be recorded." }, { status: 503 });
      }
    }
    const safeItems = toCustomerInventory(ranked.map((result) => result.item));
    return NextResponse.json({
      mode: extraction.mode,
      identified: product ?? null,
      matches: ranked.map((result, index) => ({
        item: safeItems[index],
        matchStrength: result.overlap,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Image recognition is temporarily unavailable." }, { status: 503 });
  } finally {
    if (admin && uploadedPath) {
      await admin.storage.from("customer-searches").remove([uploadedPath]);
    }
  }
}
