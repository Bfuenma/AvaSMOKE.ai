import "server-only";

import {
  developmentInventory,
  developmentQr,
  developmentShop,
} from "@/lib/development-data";
import { env, isDevelopmentFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CustomerStore,
  InventoryItem,
  Product,
  QRCode,
  Shop,
} from "@/lib/types";

type InventoryQueryRow = Omit<InventoryItem, "product"> & {
  product: Omit<Product, "brand_name"> & {
    brand: { name: string } | null;
  };
};

function mapInventoryRow(row: InventoryQueryRow): InventoryItem {
  return {
    ...row,
    product: {
      ...row.product,
      brand_name: row.product.brand?.name ?? "Unknown brand",
    },
  };
}

export interface StorefrontPayload {
  shop: Shop;
  qrCode: QRCode;
  inventory: InventoryItem[];
  developmentMode: boolean;
}

export function toCustomerInventory(items: InventoryItem[]): InventoryItem[] {
  return items.map((item) => ({
    id: item.id,
    shop_id: item.shop_id,
    product_id: item.product_id,
    internal_sku: null,
    price: item.price,
    sale_price: item.sale_price,
    stock_status: item.stock_status,
    quantity: null,
    featured: item.featured,
    staff_pick: item.staff_pick,
    recommendation_priority: 0,
    product: {
      id: item.product.id,
      brand_id: null,
      brand_name: item.product.brand_name,
      product_name: item.product.product_name,
      flavor_name: item.product.flavor_name,
      category: item.product.category,
      nicotine_percentage: item.product.nicotine_percentage,
      nicotine_mg: item.product.nicotine_mg,
      puff_count: item.product.puff_count,
      flavor_family: item.product.flavor_family,
      sweetness_level: item.product.sweetness_level,
      cooling_level: item.product.cooling_level,
      hit_strength: item.product.hit_strength,
      expected_duration_text: item.product.expected_duration_text,
      rechargeable: item.product.rechargeable,
      device_type: item.product.device_type,
      description: item.product.description,
      primary_image_url: item.product.primary_image_url,
      verification_status: item.product.verification_status,
      active: item.product.active,
    },
  }));
}

export function toCustomerStore(shop: Shop): CustomerStore {
  return {
    id: shop.id,
    name: shop.name,
    slug: shop.slug,
    description: shop.description,
    email: shop.email,
    phone: shop.phone,
    address_line_1: shop.address_line_1,
    address_line_2: shop.address_line_2,
    city: shop.city,
    state: shop.state,
    postal_code: shop.postal_code,
    allowed_radius_miles: shop.allowed_radius_miles,
    business_hours: shop.business_hours,
    status: shop.status,
  };
}

export async function getStorefront(
  storeSlug: string,
  qrCode: string | undefined,
): Promise<StorefrontPayload | null> {
  if (isDevelopmentFallback) {
    if (
      storeSlug === developmentShop.slug &&
      qrCode === developmentQr.code
    ) {
      return {
        shop: developmentShop,
        qrCode: developmentQr,
        inventory: developmentInventory,
        developmentMode: true,
      };
    }
    return null;
  }

  if (!qrCode) return null;
  // Public storefront data is resolved server-side with the service client.
  // No anonymous table policy permits shop or catalog enumeration.
  const supabase = createSupabaseAdminClient();
  if (!supabase) return null;

  const { data: codeRow, error } = await supabase
    .from("qr_codes")
    .select("*, shop:shops(*)")
    .eq("code", qrCode)
    .eq("active", true)
    .eq("shop.slug", storeSlug)
    .eq("shop.status", "active")
    .maybeSingle();
  const shop = codeRow?.shop as unknown as Shop | null;
  if (error || !codeRow || !shop) return null;

  const { data: inventoryRows } = await supabase
    .from("shop_inventory")
    .select("*, product:products(*, brand:brands(name))")
    .eq("shop_id", shop.id)
    .in("stock_status", ["in_stock", "low_stock"])
    .eq("product.active", true);
  const inventory = (inventoryRows ?? [])
    .filter((row) => row.product)
    .map((row) => mapInventoryRow(row as unknown as InventoryQueryRow));

  return {
    shop,
    qrCode: codeRow as unknown as QRCode,
    inventory,
    developmentMode: false,
  };
}

export async function getAdminOverview() {
  if (isDevelopmentFallback) {
    return {
      metrics: {
        activeStores: 2,
        pendingApplications: 1,
        totalScans: 2847,
        verifiedSessions: 1924,
        conversations: 628,
        recommendations: 1432,
        inventoryGaps: 18,
        matchCompletions: 1132,
        outsideRadius: 203,
        positiveFeedbackRate: 82,
      },
      stores: [
        { name: developmentShop.name, scans: 1284, conversion: 68 },
        { name: "Lakeview Vapor House", scans: 1037, conversion: 64 },
      ],
      scanSeries: [138, 186, 172, 241, 294, 317, 366],
      topProducts: developmentInventory.slice(0, 4),
      developmentMode: true,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const [
    stores,
    applications,
    sessions,
    conversations,
    recommendations,
    productRequests,
    feedback,
    topProducts,
  ] = await Promise.all([
    supabase.from("shops").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("shop_applications").select("id", { count: "exact", head: true }).in("status", ["new", "reviewing"]),
    supabase.from("customer_sessions").select("id, location_verified"),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("recommendations").select("id, session_id"),
    supabase.from("product_requests").select("id", { count: "exact", head: true }).eq("matching_product_found", false),
    supabase.from("customer_feedback").select("helpful"),
    supabase.from("shop_inventory").select("*, product:products(*, brand:brands(name))").in("stock_status", ["in_stock", "low_stock"]).limit(4),
  ]);

  const sessionRows = sessions.data ?? [];
  const recommendationRows = recommendations.data ?? [];
  const feedbackRows = feedback.data ?? [];
  return {
    metrics: {
      activeStores: stores.count ?? 0,
      pendingApplications: applications.count ?? 0,
      totalScans: sessionRows.length,
      verifiedSessions: sessionRows.filter((row) => row.location_verified).length,
      conversations: conversations.count ?? 0,
      recommendations: recommendationRows.length,
      inventoryGaps: productRequests.count ?? 0,
      matchCompletions: new Set(
        recommendationRows.map((row) => row.session_id),
      ).size,
      outsideRadius: sessionRows.filter((row) => !row.location_verified).length,
      positiveFeedbackRate: feedbackRows.length
        ? Math.round(
            (feedbackRows.filter((row) => row.helpful).length /
              feedbackRows.length) *
              100,
          )
        : 0,
    },
    stores: [],
    scanSeries: [],
    topProducts: (topProducts.data ?? [])
      .filter((row) => row.product)
      .map((row) => mapInventoryRow(row as unknown as InventoryQueryRow)),
    developmentMode: false,
  };
}

export async function getAdminSectionRecords(section: string): Promise<unknown[]> {
  if (section === "ai-settings") {
    return [
      {
        provider: env.AI_PROVIDER,
        model: env.AI_MODEL ?? null,
        live:
          (env.AI_PROVIDER === "anthropic" &&
            Boolean(env.ANTHROPIC_API_KEY && env.AI_MODEL)) ||
          (env.AI_PROVIDER === "openai" &&
            Boolean(env.OPENAI_API_KEY && env.AI_MODEL)),
      },
    ];
  }
  if (isDevelopmentFallback) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  if (section === "stores") {
    const { data } = await supabase
      .from("shops")
      .select("*")
      .order("created_at", { ascending: false });
    return data ?? [];
  }
  if (section === "inventory") {
    const { data } = await supabase
      .from("shop_inventory")
      .select("*, product:products(*, brand:brands(name))")
      .order("updated_at", { ascending: false })
      .limit(500);
    return (data ?? [])
      .filter((row) => row.product)
      .map((row) => mapInventoryRow(row as unknown as InventoryQueryRow));
  }
  if (section === "products") {
    const { data } = await supabase
      .from("products")
      .select("*, brand:brands(name)")
      .order("updated_at", { ascending: false })
      .limit(500);
    return (data ?? []).map((row) => {
      const brand = row.brand as { name: string } | null;
      return { ...row, brand_name: brand?.name ?? "Unknown brand" };
    });
  }
  if (section === "qr-codes") {
    const { data } = await supabase
      .from("qr_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    return data ?? [];
  }
  if (section === "applications") {
    const { data } = await supabase
      .from("shop_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  }
  if (section === "conversations") {
    const { data } = await supabase
      .from("conversations")
      .select("*, shop:shops(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    return data ?? [];
  }
  if (section === "users") {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, status")
      .order("created_at", { ascending: false })
      .limit(500);
    return data ?? [];
  }
  return [];
}
