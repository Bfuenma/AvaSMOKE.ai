export type ProfileRole = "platform_admin" | "shop_owner" | "shop_manager";
export type ShopStatus = "pending" | "active" | "suspended" | "rejected";
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "hidden";
export type ApplicationStatus = "new" | "reviewing" | "approved" | "rejected";

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  allowed_radius_miles: number;
  business_hours: Record<string, string>;
  status: ShopStatus;
}

export type CustomerStore = Omit<Shop, "latitude" | "longitude">;

export interface Product {
  id: string;
  brand_id: string | null;
  brand_name: string;
  product_name: string;
  flavor_name: string | null;
  category: string;
  nicotine_percentage: number | null;
  nicotine_mg: number | null;
  puff_count: number | null;
  flavor_family: string | null;
  sweetness_level: number | null;
  cooling_level: number | null;
  hit_strength: number | null;
  expected_duration_text: string | null;
  rechargeable: boolean;
  device_type: string | null;
  description: string | null;
  primary_image_url: string | null;
  verification_status: "unverified" | "admin_verified";
  active: boolean;
}

export interface InventoryItem {
  id: string;
  shop_id: string;
  product_id: string;
  internal_sku: string | null;
  price: number | null;
  sale_price: number | null;
  stock_status: StockStatus;
  quantity: number | null;
  featured: boolean;
  staff_pick: boolean;
  recommendation_priority: number;
  product: Product;
}

export interface QRCode {
  id: string;
  shop_id: string;
  code: string;
  label: string;
  destination_path: string;
  qr_type: "store" | "counter" | "display" | "product" | "promotional";
  product_id: string | null;
  active: boolean;
  scan_radius_override: number | null;
  total_scans: number;
  last_scanned_at: string | null;
}

export interface CustomerPreferences {
  goal?: string;
  flavorFamilies: string[];
  cooling?: number;
  strength?: number;
  budgetMin?: number;
  budgetMax?: number;
  desiredPuffCount?: number;
  currentProductText?: string;
}

export interface ScoredRecommendation {
  item: InventoryItem;
  score: number;
  reasons: string[];
}
