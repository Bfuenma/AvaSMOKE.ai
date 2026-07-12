import "server-only";

import {
  developmentInventory,
  developmentQr,
  developmentShop,
} from "@/lib/development-data";
import { isDevelopmentFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InventoryItem, Product, QRCode, Shop } from "@/lib/types";

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
    topProducts,
  ] = await Promise.all([
    supabase.from("shops").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("shop_applications").select("id", { count: "exact", head: true }).in("status", ["new", "reviewing"]),
    supabase.from("customer_sessions").select("id, location_verified"),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("recommendations").select("id", { count: "exact", head: true }),
    supabase.from("shop_inventory").select("*, product:products(*, brand:brands(name))").in("stock_status", ["in_stock", "low_stock"]).limit(4),
  ]);

  const sessionRows = sessions.data ?? [];
  return {
    metrics: {
      activeStores: stores.count ?? 0,
      pendingApplications: applications.count ?? 0,
      totalScans: sessionRows.length,
      verifiedSessions: sessionRows.filter((row) => row.location_verified).length,
      conversations: conversations.count ?? 0,
      recommendations: recommendations.count ?? 0,
    },
    stores: [],
    scanSeries: [],
    topProducts: (topProducts.data ?? [])
      .filter((row) => row.product)
      .map((row) => mapInventoryRow(row as unknown as InventoryQueryRow)),
    developmentMode: false,
  };
}
