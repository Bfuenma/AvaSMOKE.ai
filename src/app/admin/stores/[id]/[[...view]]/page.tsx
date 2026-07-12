import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Pencil, QrCode, Store as StoreIcon } from "lucide-react";

import { QRCodeCard } from "@/components/qr-code-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { developmentInventory, developmentQr, developmentShop } from "@/lib/development-data";
import { isDevelopmentFallback } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InventoryItem, QRCode, Shop } from "@/lib/types";
import { formatCurrency, titleCase } from "@/lib/utils";

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string; view?: string[] }>;
}) {
  const { id, view = [] } = await params;
  const activeView = view[0] ?? "overview";
  let shop: Shop | null = null;
  let inventory: InventoryItem[] = [];
  let qrCodes: QRCode[] = [];

  if (isDevelopmentFallback && id === developmentShop.id) {
    shop = developmentShop;
    inventory = developmentInventory;
    qrCodes = [developmentQr];
  } else if (!isDevelopmentFallback) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const [shopResult, inventoryResult, qrResult] = await Promise.all([
        supabase.from("shops").select("*").eq("id", id).maybeSingle(),
        supabase.from("shop_inventory").select("*, product:products(*, brand:brands(name))").eq("shop_id", id),
        supabase.from("qr_codes").select("*").eq("shop_id", id),
      ]);
      shop = shopResult.data as Shop | null;
      inventory = (inventoryResult.data ?? []).map((row) => {
        const product = row.product as unknown as InventoryItem["product"] & { brand?: { name: string } };
        return { ...row, product: { ...product, brand_name: product.brand?.name ?? "Unknown brand" } } as unknown as InventoryItem;
      });
      qrCodes = (qrResult.data ?? []) as QRCode[];
    }
  }
  if (!shop) notFound();

  const tabs = [
    ["overview", "Overview"],
    ["inventory", "Inventory"],
    ["qr-codes", "QR codes"],
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><StoreIcon className="size-4" /> Stores / {shop.name}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{shop.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" /> {shop.address_line_1}, {shop.city}, {shop.state} {shop.postal_code}</p>
        </div>
        <Button variant="outline"><Pencil /> Edit store</Button>
      </div>
      <div className="flex gap-1 border-b">
        {tabs.map(([key, label]) => <Link key={key} href={key === "overview" ? `/admin/stores/${id}` : `/admin/stores/${id}/${key}`} className={`border-b-2 px-4 py-3 text-sm ${activeView === key ? "border-violet-400 text-white" : "border-transparent text-muted-foreground"}`}>{label}</Link>)}
      </div>

      {activeView === "overview" && <div className="grid gap-5 lg:grid-cols-3">
        <Card className="rounded-2xl bg-card/70"><CardHeader><CardTitle>Store status</CardTitle></CardHeader><CardContent><Badge variant="outline" className="text-emerald-300">{titleCase(shop.status)}</Badge><p className="mt-4 text-sm text-muted-foreground">{shop.allowed_radius_miles} mile access radius</p></CardContent></Card>
        <Card className="rounded-2xl bg-card/70"><CardHeader><CardTitle>Available inventory</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{inventory.filter((item) => ["in_stock", "low_stock"].includes(item.stock_status)).length}</p><p className="mt-2 text-sm text-muted-foreground">{inventory.filter((item) => item.stock_status === "low_stock").length} low-stock products</p></CardContent></Card>
        <Card className="rounded-2xl bg-card/70"><CardHeader><CardTitle>QR activity</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{qrCodes.reduce((sum, code) => sum + code.total_scans, 0).toLocaleString()}</p><p className="mt-2 text-sm text-muted-foreground">{qrCodes.filter((code) => code.active).length} active codes</p></CardContent></Card>
      </div>}

      {activeView === "inventory" && <Card className="overflow-x-auto rounded-2xl bg-card/70"><Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Quantity</TableHead></TableRow></TableHeader><TableBody>{inventory.map((item) => <TableRow key={item.id}><TableCell><div className="font-medium">{item.product.brand_name} {item.product.flavor_name}</div><div className="text-xs text-muted-foreground">{item.internal_sku}</div></TableCell><TableCell>{formatCurrency(item.sale_price ?? item.price)}</TableCell><TableCell><Badge variant="outline">{titleCase(item.stock_status)}</Badge></TableCell><TableCell>{item.quantity ?? "—"}</TableCell></TableRow>)}</TableBody></Table></Card>}

      {activeView === "qr-codes" && <div className="grid gap-4 xl:grid-cols-2">{qrCodes.length ? qrCodes.map((code) => <QRCodeCard key={code.id} label={code.label} path={code.destination_path} active={code.active} scans={code.total_scans} />) : <Card className="rounded-2xl"><CardContent className="p-8 text-center"><QrCode className="mx-auto text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No QR codes generated for this store.</p></CardContent></Card>}</div>}
    </div>
  );
}
