import { NextResponse } from "next/server";
import { z } from "zod";

import { getAdminIdentity } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeSearchText } from "@/lib/utils";

const storeSchema = z.object({
  action: z.literal("store.create"),
  name: z.string().trim().min(2).max(160),
  email: z.union([z.email(), z.literal("")]).optional(),
  phone: z.string().trim().max(30).optional(),
  addressLine1: z.string().trim().min(4).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(20),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  allowedRadiusMiles: z.number().positive().max(50).default(1),
  status: z.enum(["pending", "active", "suspended"]).default("active"),
});

const inventorySchema = z.object({
  action: z.literal("inventory.update"),
  inventoryId: z.uuid(),
  price: z.number().nonnegative().nullable().optional(),
  salePrice: z.number().nonnegative().nullable().optional(),
  stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock", "hidden"]).optional(),
  quantity: z.number().int().nonnegative().nullable().optional(),
  featured: z.boolean().optional(),
  staffPick: z.boolean().optional(),
  recommendationPriority: z.number().int().min(-10).max(10).optional(),
});

const productSchema = z.object({
  action: z.literal("product.confirm"),
  shopId: z.uuid().optional(),
  brand: z.string().trim().min(1).max(120),
  productName: z.string().trim().min(2).max(180),
  flavorName: z.string().trim().max(120).nullable().optional(),
  category: z.string().trim().min(2).max(100),
  puffCount: z.number().int().positive().nullable().optional(),
  nicotinePercentage: z.number().min(0).max(100).nullable().optional(),
  rechargeable: z.boolean().default(false),
  deviceType: z.string().trim().max(100).nullable().optional(),
  flavorFamily: z.string().trim().max(80).nullable().optional(),
  sweetnessLevel: z.number().int().min(1).max(10).nullable().optional(),
  coolingLevel: z.number().int().min(1).max(10).nullable().optional(),
  hitStrength: z.number().int().min(1).max(10).nullable().optional(),
  aiExtractedData: z.record(z.string(), z.unknown()).optional(),
  price: z.number().nonnegative().nullable().optional(),
  stockStatus: z.enum(["in_stock", "low_stock", "out_of_stock", "hidden"]).default("in_stock"),
});

const qrSchema = z.object({
  action: z.literal("qr.create"),
  shopId: z.uuid(),
  label: z.string().trim().min(2).max(120),
  qrType: z.enum(["store", "counter", "display", "product", "promotional"]),
  productId: z.uuid().nullable().optional(),
  radiusOverride: z.number().positive().max(50).nullable().optional(),
});

const applicationSchema = z.object({
  action: z.literal("application.review"),
  applicationId: z.uuid(),
  status: z.enum(["reviewing", "approved", "rejected"]),
  adminNotes: z.string().trim().max(5000).nullable().optional(),
});

const requestSchema = z.discriminatedUnion("action", [
  storeSchema,
  inventorySchema,
  productSchema,
  qrSchema,
  applicationSchema,
]);

function slugify(value: string) {
  return normalizeSearchText(value).replaceAll(" ", "-").slice(0, 90);
}

export async function POST(request: Request) {
  const admin = await getAdminIdentity();
  if (!admin || admin.preview) {
    return NextResponse.json(
      { error: admin?.preview ? "Changes are disabled in development preview." : "Unauthorized." },
      { status: admin?.preview ? 409 : 401 },
    );
  }
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "Admin service is not configured." }, { status: 503 });
  const value = parsed.data;

  if (value.action === "store.create") {
    let slug = slugify(value.name);
    const { count } = await supabase.from("shops").select("id", { count: "exact", head: true }).eq("slug", slug);
    if (count) slug = `${slug}-${crypto.randomUUID().slice(0, 6)}`;
    const { data, error } = await supabase.from("shops").insert({
      name: value.name,
      slug,
      email: value.email || null,
      phone: value.phone || null,
      address_line_1: value.addressLine1,
      address_line_2: value.addressLine2 || null,
      city: value.city,
      state: value.state,
      postal_code: value.postalCode,
      latitude: value.latitude,
      longitude: value.longitude,
      allowed_radius_miles: value.allowedRadiusMiles,
      status: value.status,
    }).select().single();
    return NextResponse.json(error ? { error: error.message } : { data }, { status: error ? 500 : 201 });
  }

  if (value.action === "inventory.update") {
    const updates = {
      ...(value.price !== undefined && { price: value.price }),
      ...(value.salePrice !== undefined && { sale_price: value.salePrice }),
      ...(value.stockStatus !== undefined && { stock_status: value.stockStatus }),
      ...(value.quantity !== undefined && { quantity: value.quantity }),
      ...(value.featured !== undefined && { featured: value.featured }),
      ...(value.staffPick !== undefined && { staff_pick: value.staffPick }),
      ...(value.recommendationPriority !== undefined && { recommendation_priority: value.recommendationPriority }),
    };
    const { data, error } = await supabase.from("shop_inventory").update(updates).eq("id", value.inventoryId).select().single();
    return NextResponse.json(error ? { error: error.message } : { data }, { status: error ? 500 : 200 });
  }

  if (value.action === "product.confirm") {
    const normalizedBrand = normalizeSearchText(value.brand);
    const normalizedProduct = normalizeSearchText(value.brand, value.productName, value.flavorName);
    const { data: possibleDuplicates } = await supabase.from("products").select("id, product_name, flavor_name, brand:brands(name)").eq("normalized_search_text", normalizedProduct).limit(5);
    if (possibleDuplicates?.length) {
      return NextResponse.json({ duplicate: true, matches: possibleDuplicates }, { status: 409 });
    }
    const { data: brand, error: brandError } = await supabase.from("brands").upsert({ name: value.brand, normalized_name: normalizedBrand }, { onConflict: "normalized_name" }).select("id").single();
    if (brandError) return NextResponse.json({ error: brandError.message }, { status: 500 });
    const { data: product, error } = await supabase.from("products").insert({
      brand_id: brand.id,
      product_name: value.productName,
      flavor_name: value.flavorName ?? null,
      normalized_search_text: normalizedProduct,
      category: value.category,
      puff_count: value.puffCount ?? null,
      nicotine_percentage: value.nicotinePercentage ?? null,
      rechargeable: value.rechargeable,
      device_type: value.deviceType ?? null,
      flavor_family: value.flavorFamily ?? null,
      sweetness_level: value.sweetnessLevel ?? null,
      cooling_level: value.coolingLevel ?? null,
      hit_strength: value.hitStrength ?? null,
      ai_extracted_data: value.aiExtractedData ?? {},
      verification_status: "admin_verified",
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (value.shopId) {
      const { error: inventoryError } = await supabase.from("shop_inventory").insert({
        shop_id: value.shopId,
        product_id: product.id,
        price: value.price ?? null,
        stock_status: value.stockStatus,
      });
      if (inventoryError) {
        await supabase.from("products").delete().eq("id", product.id);
        return NextResponse.json(
          { error: "The product could not be assigned to this store." },
          { status: 500 },
        );
      }
    }
    return NextResponse.json({ data: product }, { status: 201 });
  }

  if (value.action === "qr.create") {
    const { data: shop } = await supabase.from("shops").select("slug").eq("id", value.shopId).single();
    if (!shop) return NextResponse.json({ error: "Store not found." }, { status: 404 });
    const code = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().slice(0, 8);
    const destinationPath = `/app/store/${shop.slug}?qr=${code}`;
    const { data, error } = await supabase.from("qr_codes").insert({
      shop_id: value.shopId,
      code,
      label: value.label,
      destination_path: destinationPath,
      qr_type: value.qrType,
      product_id: value.productId ?? null,
      scan_radius_override: value.radiusOverride ?? null,
    }).select().single();
    return NextResponse.json(error ? { error: error.message } : { data }, { status: error ? 500 : 201 });
  }

  const { data, error } = await supabase.from("shop_applications").update({
    status: value.status,
    admin_notes: value.adminNotes ?? null,
    reviewed_by: admin.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", value.applicationId).select().single();
  return NextResponse.json(error ? { error: error.message } : { data }, { status: error ? 500 : 200 });
}
