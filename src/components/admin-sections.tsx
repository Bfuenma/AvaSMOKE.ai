"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Archive,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Filter,
  KeyRound,
  MapPin,
  MoreHorizontal,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

import { MetricCard } from "@/components/admin-dashboard";
import { ProductUploadDropzone } from "@/components/product-upload";
import { QRCodeCard } from "@/components/qr-code-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { developmentInventory, developmentQr, developmentShop } from "@/lib/development-data";
import { formatCurrency, titleCase } from "@/lib/utils";

const titles: Record<string, [string, string]> = {
  stores: ["Stores", "Manage locations, access radius, status, and store-specific configuration."],
  inventory: ["Store Inventory", "Control exactly which products are eligible for customer recommendations."],
  products: ["Product Catalog", "A reusable master catalog shared across approved store locations."],
  upload: ["AI-assisted Product Upload", "Extract packaging details, review uncertainty, and add products in bulk."],
  "qr-codes": ["QR Codes", "Generate secure, store-specific entry points and inspect scan performance."],
  applications: ["Shop Applications", "Review applicants before creating stores or owner access."],
  conversations: ["Conversations", "Review anonymous customer questions and grounded assistant responses."],
  analytics: ["Analytics", "Measure verified engagement, recommendation activity, and inventory demand."],
  "ai-settings": ["AI Settings", "Configure provider behavior, grounding, and mock-mode visibility."],
  users: ["Users", "Manage platform roles and prepare future shop-owner access."],
  settings: ["System Settings", "Privacy, age-gate, retention, and operational defaults."],
};

function PageHeader({
  section,
  action,
}: {
  section: string;
  action?: React.ReactNode;
}) {
  const [title, description] = titles[section] ?? [titleCase(section), ""];
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="text-sm text-violet-300">Platform admin</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyProductionData() {
  return (
    <Alert>
      <CircleAlert />
      <AlertDescription>
        No records yet. This view reads from Supabase and never substitutes
        development fixtures in a configured environment.
      </AlertDescription>
    </Alert>
  );
}

function StoreForm() {
  const [status, setStatus] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function createStore(formData: FormData) {
    setSaving(true);
    setStatus(undefined);
    const response = await fetch("/api/admin/manage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "store.create",
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        addressLine1: formData.get("addressLine1"),
        city: formData.get("city"),
        state: formData.get("state"),
        postalCode: formData.get("postalCode"),
        latitude: Number(formData.get("latitude")),
        longitude: Number(formData.get("longitude")),
        allowedRadiusMiles: Number(formData.get("allowedRadiusMiles")),
        status: formData.get("status"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    setStatus(
      response.ok
        ? "Store created. Assign inventory and generate its first QR code next."
        : result.error ?? "Unable to create store.",
    );
    setSaving(false);
  }

  const fields = [
    ["name", "Store name", "text"],
    ["email", "Email", "email"],
    ["phone", "Phone", "tel"],
    ["addressLine1", "Address line 1", "text"],
    ["city", "City", "text"],
    ["state", "State", "text"],
    ["postalCode", "Postal code", "text"],
    ["latitude", "Latitude", "number"],
    ["longitude", "Longitude", "number"],
  ] as const;
  return (
    <form action={createStore} className="grid gap-4 sm:grid-cols-2">
      {fields.map(([name, label, type]) => (
        <div key={name} className={`space-y-2 ${name === "addressLine1" ? "sm:col-span-2" : ""}`}>
          <Label htmlFor={name}>{label}</Label>
          <Input id={name} name={name} type={type} step={type === "number" ? "any" : undefined} required={!["email", "phone"].includes(name)} />
        </div>
      ))}
      <div className="space-y-2">
        <Label>Allowed radius</Label>
        <Select name="allowedRadiusMiles" defaultValue="1">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {["0.25", "0.5", "1", "2", "5"].map((radius) => (
              <SelectItem value={radius} key={radius}>{radius} mile{radius === "1" ? "" : "s"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select name="status" defaultValue="active">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="sm:col-span-2 text-xs leading-5 text-muted-foreground">
        Coordinates may be entered manually now. The data model keeps address
        and coordinates separate for a future geocoding provider.
      </p>
      {status && <Alert className="sm:col-span-2"><AlertDescription>{status}</AlertDescription></Alert>}
      <Button disabled={saving} className="sm:col-span-2">{saving ? "Saving…" : "Save store"}</Button>
    </form>
  );
}

function StoresSection({ developmentMode }: { developmentMode: boolean }) {
  return (
    <div className="space-y-6">
      <PageHeader section="stores" action={
        <Dialog>
          <DialogTrigger asChild><Button><Plus /> Add store</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add store</DialogTitle>
              <DialogDescription>Create the location before assigning inventory or QR codes.</DialogDescription>
            </DialogHeader>
            <StoreForm />
          </DialogContent>
        </Dialog>
      } />
      {!developmentMode ? <EmptyProductionData /> : (
        <Card className="overflow-hidden rounded-2xl bg-card/70">
          <Table>
            <TableHeader><TableRow><TableHead>Store</TableHead><TableHead>Status</TableHead><TableHead>Radius</TableHead><TableHead>Inventory</TableHead><TableHead>Scans</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {[developmentShop, { ...developmentShop, id: "shop-2", name: "Lakeview Vapor House", slug: "lakeview-vapor-house", city: "Chicago", allowed_radius_miles: .5 }].map((shop, index) => (
                <TableRow key={shop.id}>
                  <TableCell><div className="font-medium">{shop.name}</div><div className="mt-1 text-xs text-muted-foreground">{shop.city}, {shop.state}</div></TableCell>
                  <TableCell><Badge variant="outline" className="text-emerald-300">Active</Badge></TableCell>
                  <TableCell>{shop.allowed_radius_miles} mi</TableCell>
                  <TableCell>{index ? 14 : developmentInventory.length} products</TableCell>
                  <TableCell>{index ? "1,037" : "1,284"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon"><ChevronRight /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function InventorySection({ developmentMode }: { developmentMode: boolean }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => developmentMode ? developmentInventory.filter((item) =>
    `${item.product.brand_name} ${item.product.flavor_name}`.toLowerCase().includes(query.toLowerCase()),
  ) : [], [developmentMode, query]);
  return (
    <div className="space-y-6">
      <PageHeader section="inventory" action={<Button><PackagePlus /> Add product</Button>} />
      <div className="flex flex-col gap-3 rounded-2xl border bg-card/50 p-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute start-3 top-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search brand, flavor, or SKU" className="ps-9" /></div>
        <Select defaultValue="all"><SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All stock statuses</SelectItem><SelectItem value="in_stock">In stock</SelectItem><SelectItem value="low_stock">Low stock</SelectItem><SelectItem value="out_of_stock">Out of stock</SelectItem><SelectItem value="hidden">Hidden</SelectItem></SelectContent></Select>
        <Button variant="outline"><Filter /> Filters</Button>
      </div>
      {!developmentMode ? <EmptyProductionData /> : (
        <Card className="overflow-x-auto rounded-2xl bg-card/70">
          <Table>
            <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Quantity</TableHead><TableHead>Featured</TableHead><TableHead>Staff pick</TableHead><TableHead>Priority</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>{rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell><div className="font-medium">{item.product.brand_name} {item.product.flavor_name}</div><div className="text-xs text-muted-foreground">{item.internal_sku}</div></TableCell>
                <TableCell>{formatCurrency(item.sale_price ?? item.price)}</TableCell>
                <TableCell><Badge variant="outline" className={item.stock_status === "low_stock" ? "text-amber-300" : "text-emerald-300"}>{titleCase(item.stock_status)}</Badge></TableCell>
                <TableCell>{item.quantity ?? "—"}</TableCell>
                <TableCell><Switch defaultChecked={item.featured} aria-label="Featured" /></TableCell>
                <TableCell><Switch defaultChecked={item.staff_pick} aria-label="Staff pick" /></TableCell>
                <TableCell>{item.recommendation_priority}</TableCell>
                <TableCell><Button variant="ghost" size="icon"><MoreHorizontal /></Button></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function ProductsSection({ developmentMode }: { developmentMode: boolean }) {
  return (
    <div className="space-y-6">
      <PageHeader section="products" action={<Button><Plus /> New product</Button>} />
      <div className="flex gap-3 rounded-2xl border bg-card/50 p-3">
        <Input placeholder="Search catalog" className="max-w-md" />
        <Button variant="outline"><Filter /> Brand, flavor, category</Button>
      </div>
      {!developmentMode ? <EmptyProductionData /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {developmentInventory.slice(0, 6).map((item) => (
            <Card key={item.product.id} className="rounded-2xl bg-card/70">
              <CardContent className="p-5">
                <div className="flex items-start justify-between"><div className="grid size-12 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><PackagePlus /></div><Badge variant="outline" className="text-emerald-300">Verified</Badge></div>
                <p className="mt-5 text-xs text-muted-foreground">{item.product.brand_name}</p>
                <h3 className="mt-1 font-medium">{item.product.flavor_name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.product.flavor_family} · {item.product.puff_count?.toLocaleString()} puffs</p>
                <div className="mt-5 flex gap-2"><Button size="sm" variant="outline">Edit</Button><Button size="sm" variant="ghost"><Archive /> Archive</Button></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function QrSection({ developmentMode }: { developmentMode: boolean }) {
  return (
    <div className="space-y-6">
      <PageHeader section="qr-codes" action={<Button><Plus /> Generate QR</Button>} />
      {!developmentMode ? <EmptyProductionData /> : (
        <div className="grid gap-4 xl:grid-cols-2">
          <QRCodeCard label={developmentQr.label} path={developmentQr.destination_path} active scans={developmentQr.total_scans} />
          <QRCodeCard label="Checkout counter" path="/app/store/northstar-smoke-vape?qr=demo-disabled" active={false} scans={184} />
        </div>
      )}
    </div>
  );
}

function ApplicationsSection({ developmentMode }: { developmentMode: boolean }) {
  return (
    <div className="space-y-6">
      <PageHeader section="applications" />
      {!developmentMode ? <EmptyProductionData /> : (
        <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <Card className="rounded-2xl bg-card/70">
            <CardContent className="p-3">
              <button className="w-full rounded-xl border border-violet-400/30 bg-violet-500/[.08] p-4 text-left">
                <div className="flex items-center justify-between"><span className="font-medium">City Smoke Collective</span><Badge>New</Badge></div>
                <p className="mt-2 text-sm text-muted-foreground">Jordan Lee · Chicago, IL</p>
                <p className="mt-3 text-xs text-muted-foreground">2 locations · received today</p>
              </button>
            </CardContent>
          </Card>
          <Card className="rounded-2xl bg-card/70">
            <CardHeader><CardTitle>City Smoke Collective</CardTitle><p className="text-sm text-muted-foreground">Applicant review</p></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">{[["Applicant", "Jordan Lee"], ["Email", "jordan@example.test"], ["Phone", "(312) 555-0198"], ["Locations", "2"]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm">{value}</p></div>)}</div>
              <div className="space-y-2"><Label>Internal notes</Label><Textarea placeholder="Visible only to platform admins" /></div>
              <div className="rounded-xl border p-4"><p className="text-sm font-medium">Approval setup</p><ol className="mt-3 space-y-2 text-sm text-muted-foreground">{["Create shop record", "Confirm coordinates and radius", "Prepare owner access", "Create initial QR code", "Add inventory"].map((step, index) => <li key={step} className="flex gap-2"><span>{index + 1}.</span>{step}</li>)}</ol></div>
              <div className="flex gap-2"><Button><CheckCircle2 /> Approve and set up</Button><Button variant="outline">Mark reviewing</Button><Button variant="ghost" className="text-red-300">Reject</Button></div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <PageHeader section="analytics" action={<Button variant="outline"><Download /> Export CSV</Button>} />
      <div className="flex flex-wrap gap-3 rounded-2xl border bg-card/50 p-3">{["Last 30 days", "All stores", "All QR codes", "All products", "All brands"].map((filter) => <Button key={filter} variant="outline" size="sm">{filter}</Button>)}</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Valid sessions" value="1,924" note="67.6% of scans" icon={ShieldCheck} />
        <MetricCard label="Match completions" value="1,132" note="79.1% completion" icon={CheckCircle2} />
        <MetricCard label="Positive feedback" value="82%" note="Threshold-qualified" icon={Activity} />
        <MetricCard label="Outside radius" value="203" note="Access blocked" icon={MapPin} />
      </div>
      <Card className="rounded-2xl bg-card/70"><CardHeader><CardTitle>Inventory Opportunities</CardTitle></CardHeader><CardContent className="space-y-4">{[["Mango + strong cooling", 42, "Only one matching product"], ["Dessert + smooth hit", 27, "No matching products"], ["Tropical under $20", 21, "Two products, both low stock"]].map(([name, count, note]) => <div key={name} className="flex items-center justify-between border-b pb-4 last:border-0"><div><p className="text-sm">{name}</p><p className="text-xs text-muted-foreground">{note}</p></div><Badge variant="secondary">{count} requests</Badge></div>)}</CardContent></Card>
    </div>
  );
}

function SettingsSection({ section }: { section: string }) {
  const isAi = section === "ai-settings";
  const isUsers = section === "users";
  return (
    <div className="space-y-6">
      <PageHeader section={section} action={isUsers ? <Button><Plus /> Invite user</Button> : undefined} />
      {isUsers ? (
        <Card className="rounded-2xl bg-card/70"><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Scope</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><div className="font-medium">Development Admin</div><div className="text-xs text-muted-foreground">development@avasmoke.ai</div></TableCell><TableCell>Platform admin</TableCell><TableCell><Badge variant="outline" className="text-emerald-300">Active</Badge></TableCell><TableCell>All stores</TableCell></TableRow></TableBody></Table></Card>
      ) : (
        <Tabs defaultValue="general" className="space-y-5">
          <TabsList><TabsTrigger value="general">{isAi ? "Provider" : "General"}</TabsTrigger><TabsTrigger value="rules">{isAi ? "Grounding" : "Privacy"}</TabsTrigger><TabsTrigger value="advanced">Advanced</TabsTrigger></TabsList>
          <TabsContent value="general"><Card className="max-w-3xl rounded-2xl bg-card/70"><CardContent className="space-y-6 p-6">
            {isAi ? <>
              <Alert><Bot /><AlertDescription>AI keys are read only from server environment variables and are never returned to the browser.</AlertDescription></Alert>
              <div className="space-y-2"><Label>Provider</Label><Select defaultValue="mock"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mock">Mock mode</SelectItem><SelectItem value="openai">OpenAI</SelectItem><SelectItem value="anthropic">Anthropic</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Model ID</Label><Input placeholder="Configured with AI_MODEL" disabled /></div>
              <div className="flex items-center justify-between rounded-xl border p-4"><div><p className="text-sm">Require human review for product extraction</p><p className="text-xs text-muted-foreground">AI output can never publish silently.</p></div><Switch defaultChecked disabled /></div>
            </> : <>
              <div className="space-y-2"><Label>Minimum age</Label><Input type="number" defaultValue="21" /></div>
              <div className="space-y-2"><Label>Default access radius</Label><Select defaultValue="1"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 mile</SelectItem><SelectItem value=".5">0.5 mile</SelectItem><SelectItem value="2">2 miles</SelectItem></SelectContent></Select></div>
              <div className="flex items-center justify-between rounded-xl border p-4"><div><p className="text-sm">Show exact inventory quantity to customers</p><p className="text-xs text-muted-foreground">Stock status remains visible.</p></div><Switch /></div>
            </>}
            <Button>Save settings</Button>
          </CardContent></Card></TabsContent>
          <TabsContent value="rules"><Card className="max-w-3xl rounded-2xl bg-card/70"><CardContent className="p-6 text-sm leading-7 text-muted-foreground">{isAi ? "Recommendations are restricted to active in-stock or low-stock inventory returned for the verified store. Missing specifications remain unavailable. Medical, health, safety, and youth-targeted claims are prohibited." : "Exact customer coordinates are used transiently to calculate distance and are not persisted. Anonymous interaction data supports store analytics. Product photos may be processed for identification."}</CardContent></Card></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ConversationsSection({ developmentMode }: { developmentMode: boolean }) {
  return (
    <div className="space-y-6"><PageHeader section="conversations" />{!developmentMode ? <EmptyProductionData /> : <Card className="rounded-2xl bg-card/70"><Table><TableHeader><TableRow><TableHead>Store</TableHead><TableHead>Customer question</TableHead><TableHead>Outcome</TableHead><TableHead>Time</TableHead></TableRow></TableHeader><TableBody>{[["Northstar Smoke & Vape", "I want something sweet with strong ice", "3 grounded matches", "4 min ago"], ["Lakeview Vapor House", "What lasts the longest under $25?", "2 grounded matches", "18 min ago"]].map((row) => <TableRow key={row[1]}>{row.map((value) => <TableCell key={value}>{value}</TableCell>)}</TableRow>)}</TableBody></Table></Card>}</div>
  );
}

export function AdminSection({
  section,
  developmentMode,
}: {
  section: string;
  developmentMode: boolean;
}) {
  if (section === "stores") return <StoresSection developmentMode={developmentMode} />;
  if (section === "inventory") return <InventorySection developmentMode={developmentMode} />;
  if (section === "products") return <ProductsSection developmentMode={developmentMode} />;
  if (section === "upload") return <div className="space-y-6"><PageHeader section="upload" /><ProductUploadDropzone /></div>;
  if (section === "qr-codes") return <QrSection developmentMode={developmentMode} />;
  if (section === "applications") return <ApplicationsSection developmentMode={developmentMode} />;
  if (section === "conversations") return <ConversationsSection developmentMode={developmentMode} />;
  if (section === "analytics") return <AnalyticsSection />;
  if (["ai-settings", "users", "settings"].includes(section)) return <SettingsSection section={section} />;
  return <div><PageHeader section={section} /><div className="mt-6"><EmptyProductionData /></div></div>;
}
