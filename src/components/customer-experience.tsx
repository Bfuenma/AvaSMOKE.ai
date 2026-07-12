"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Compass,
  Loader2,
  LocateFixed,
  MapPin,
  MessageCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";

import { AvaSmokeWordmark } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { CustomerPreferences, InventoryItem, ScoredRecommendation, Shop } from "@/lib/types";
import { cn, formatCurrency, titleCase } from "@/lib/utils";

type Flow = "location" | "blocked" | "denied" | "age" | "welcome" | "match" | "results" | "browse" | "chat" | "camera" | "compare" | "underage";
type RecommendationResult = ScoredRecommendation & { explanation: string };

export function QuickChoiceButton({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "min-h-14 rounded-2xl border bg-white/[.025] px-4 py-3 text-left text-sm font-medium transition active:scale-[.985]",
        selected
          ? "border-violet-400/70 bg-violet-500/15 text-white shadow-[0_0_0_1px_rgba(168,85,247,.15)]"
          : "text-violet-50 hover:border-violet-300/35 hover:bg-white/[.045]",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        {children}
        {selected && <Check className="size-4 text-violet-300" />}
      </span>
    </button>
  );
}

function MobilePageHeader({
  storeName,
  back,
}: {
  storeName: string;
  back?: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-[#08060d]/90 px-4 backdrop-blur-xl">
      {back ? (
        <Button variant="ghost" size="icon" onClick={back} aria-label="Go back">
          <ArrowLeft />
        </Button>
      ) : (
        <div className="size-9" />
      )}
      <div className="text-center">
        <AvaSmokeWordmark className="text-base" />
        <p className="max-w-[180px] truncate text-[10px] text-muted-foreground">{storeName}</p>
      </div>
      <div className="size-9" />
    </header>
  );
}

function ProductVisual({ item }: { item: InventoryItem }) {
  return (
    <div className="relative aspect-[1.15] overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_50%_25%,rgba(192,132,252,.28),transparent_45%),linear-gradient(145deg,#1b1128,#0d0913)]">
      <div className="absolute inset-0 grid place-items-center p-5 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-[.25em] text-violet-300">{item.product.brand_name}</p>
          <p className="mt-2 text-xl font-semibold tracking-tight">{item.product.flavor_name}</p>
        </div>
      </div>
      {(item.staff_pick || item.featured) && (
        <Badge className="absolute start-3 top-3 bg-violet-500/85">{item.staff_pick ? "Staff pick" : "Featured"}</Badge>
      )}
    </div>
  );
}

export function ProductCard({
  item,
  onCompare,
}: {
  item: InventoryItem;
  onCompare?: () => void;
}) {
  return (
    <Card className="rounded-3xl bg-card/80 py-0">
      <CardContent className="p-3">
        <ProductVisual item={item} />
        <div className="p-2 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs text-muted-foreground">{item.product.brand_name}</p><h3 className="mt-1 font-semibold">{item.product.flavor_name}</h3></div>
            <p className="font-semibold">{formatCurrency(item.sale_price ?? item.price)}</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.product.flavor_family} · {item.product.puff_count?.toLocaleString()} puffs · {item.product.nicotine_percentage ?? "—"}% nicotine</p>
          <div className="mt-3 flex items-center justify-between">
            <Badge variant="outline" className={item.stock_status === "low_stock" ? "text-amber-300" : "text-emerald-300"}>{titleCase(item.stock_status)}</Badge>
            {onCompare && <Button variant="ghost" size="sm" onClick={onCompare}>Compare</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LocationPermissionCard({
  store,
  loading,
  onAllow,
  developmentMode,
  onTest,
}: {
  store: Shop;
  loading: boolean;
  onAllow: () => void;
  developmentMode: boolean;
  onTest: () => void;
}) {
  const [why, setWhy] = useState(false);
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-5 py-10">
      <Card className="glass w-full rounded-[2rem]">
        <CardContent className="p-6 text-center sm:p-8">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-500/12 text-violet-300"><LocateFixed /></div>
          <p className="mt-6 text-sm text-violet-300">{store.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">See what’s available here</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Allow location so AvaSmoke.Ai can show products available at this store.
          </p>
          <Button size="lg" className="mt-7 h-13 w-full rounded-2xl" onClick={onAllow} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Compass />}
            {loading ? "Checking location…" : "Allow Location"}
          </Button>
          <button type="button" onClick={() => setWhy((value) => !value)} className="mt-4 text-sm text-violet-300">
            Why is this needed?
          </button>
          {why && <p className="mt-4 rounded-xl border bg-white/[.02] p-3 text-left text-xs leading-5 text-muted-foreground">Location verifies that you are visiting this store. Exact coordinates are used only to calculate distance and are not permanently stored by default.</p>}
          {developmentMode && <Button variant="ghost" size="sm" className="mt-4 w-full text-amber-200" onClick={onTest}>Use store coordinates for development test</Button>}
        </CardContent>
      </Card>
    </div>
  );
}

function AgeGate({ onConfirm, onDecline }: { onConfirm: () => void; onDecline: () => void }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-5 py-10">
      <Card className="glass w-full rounded-[2rem]">
        <CardContent className="p-7 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-500/12 text-violet-300"><ShieldCheck /></div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Are you 21 or older?</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">AvaSmoke.Ai is intended only for adults of legal purchasing age.</p>
          <Button size="lg" className="mt-7 h-13 w-full rounded-2xl" onClick={onConfirm}>Yes, I am 21+</Button>
          <Button variant="ghost" className="mt-2 h-12 w-full" onClick={onDecline}>No</Button>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">This is an age confirmation, not identity verification. Local laws still apply.</p>
        </CardContent>
      </Card>
    </div>
  );
}

const matchQuestions = [
  { key: "goal", title: "What are you looking for?", multiple: false, choices: ["Best flavor", "Strongest hit", "Smoothest option", "Most cooling", "Sweetest", "Long-lasting", "Best value", "Premium option", "Something new", "Surprise me"] },
  { key: "flavorFamilies", title: "What flavors do you like?", multiple: true, choices: ["Fruity", "Tropical", "Candy", "Dessert", "Mint", "Menthol", "Beverage", "Tobacco", "Mixed", "Not sure"] },
  { key: "cooling", title: "Cooling preference", multiple: false, choices: ["No ice", "Light ice", "Medium ice", "Strong ice", "Extra cold", "Not sure"], values: [1, 3, 5, 8, 10, undefined] },
  { key: "strength", title: "Strength preference", multiple: false, choices: ["Smooth", "Medium", "Strong", "Very strong", "Not sure"], values: [2, 5, 8, 10, undefined] },
] as const;

function MatchFlow({
  inventory,
  onComplete,
}: {
  inventory: InventoryItem[];
  onComplete: (preferences: CustomerPreferences) => void;
}) {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<CustomerPreferences>({ flavorFamilies: [] });
  const prices = inventory.map((item) => item.sale_price ?? item.price).filter((price): price is number => price != null);
  const budgets = [
    ["Lowest price", Math.min(...prices)],
    ...(prices.some((price) => price < 20) ? [["Under $20", 20] as const] : []),
    ...(prices.some((price) => price >= 20 && price <= 30) ? [["$20–$30", 30] as const] : []),
    ...(prices.some((price) => price > 30) ? [["$30+", 999] as const] : []),
    ["No budget preference", undefined],
  ] as const;
  const isBudget = step === 4;
  const question = matchQuestions[step];
  const questionValues =
    !isBudget && question && "values" in question
      ? question.values
      : undefined;

  function select(index: number, label: string, value?: number) {
    if (isBudget) {
      setPreferences((current) => ({ ...current, budgetMax: value }));
      return;
    }
    if (!question) return;
    if (question.key === "flavorFamilies") {
      setPreferences((current) => ({
        ...current,
        flavorFamilies: current.flavorFamilies.includes(label)
          ? current.flavorFamilies.filter((item) => item !== label)
          : [...current.flavorFamilies, label],
      }));
    } else {
      setPreferences((current) => ({
        ...current,
        [question.key]: questionValues?.[index] ?? label,
      }));
    }
  }

  const choices = isBudget
    ? budgets.map(([label, value]) => ({ label, value }))
    : question.choices.map((label, index) => ({
        label,
        value: questionValues?.[index],
      }));
  const selected = (label: string, value?: number) => {
    if (isBudget) return preferences.budgetMax === value;
    if (question.key === "flavorFamilies") return preferences.flavorFamilies.includes(label);
    return preferences[question.key as "goal"] === (value ?? label);
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-7">
      <div className="mb-8"><div className="flex justify-between text-xs text-muted-foreground"><span>Find My Match</span><span>{step + 1} of 5</span></div><Progress value={(step + 1) * 20} className="mt-3" /></div>
      <h1 className="text-3xl font-semibold tracking-tight">{isBudget ? "What’s your budget?" : question.title}</h1>
      {question?.multiple && <p className="mt-2 text-sm text-muted-foreground">Choose as many as you like.</p>}
      <div className="mt-7 grid grid-cols-2 gap-3">
        {choices.map(({ label, value }, index) => <QuickChoiceButton key={label} selected={selected(label, value)} onClick={() => select(index, label, value)}>{label}</QuickChoiceButton>)}
      </div>
      <Button size="lg" className="mt-8 h-13 w-full rounded-2xl" onClick={() => step === 4 ? onComplete(preferences) : setStep((value) => value + 1)}>
        {step === 4 ? "Show my matches" : "Continue"} <ArrowRight />
      </Button>
      {step > 0 && <Button variant="ghost" className="mt-2 w-full" onClick={() => setStep((value) => value - 1)}>Back</Button>}
    </div>
  );
}

function RecommendationResults({
  results,
  loading,
  compare,
  onCompare,
}: {
  results: RecommendationResult[];
  loading: boolean;
  compare: InventoryItem[];
  onCompare: (item: InventoryItem) => void;
}) {
  if (loading) return <div className="grid min-h-[60vh] place-items-center text-center"><div><Loader2 className="mx-auto size-8 animate-spin text-violet-300" /><p className="mt-4 text-sm text-muted-foreground">Ranking available store inventory…</p></div></div>;
  if (!results.length) return <div className="py-20 text-center"><Search className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-medium">No close match found</h2><p className="mt-2 text-sm text-muted-foreground">Try broader preferences or browse this store.</p></div>;
  return (
    <div className="mx-auto max-w-lg space-y-5 px-5 py-7">
      <div><p className="text-sm text-violet-300">Available at this store</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Your top matches</h1><p className="mt-2 text-sm text-muted-foreground">Ranked from current store inventory only.</p></div>
      {results.map((result, index) => (
        <Card key={result.item.id} className="overflow-hidden rounded-3xl bg-card/80 py-0">
          <CardContent className="p-3">
            <ProductVisual item={result.item} />
            <div className="p-2 pb-3 pt-4">
              <div className="flex items-start justify-between gap-4"><div><Badge className="mb-2">#{index + 1} match</Badge><h2 className="text-xl font-semibold">{result.item.product.brand_name} {result.item.product.flavor_name}</h2></div><p className="text-lg font-semibold">{formatCurrency(result.item.sale_price ?? result.item.price)}</p></div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{result.explanation}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-xl border p-2"><span className="block text-muted-foreground">Cooling</span>{result.item.product.cooling_level ?? "—"}/10</div><div className="rounded-xl border p-2"><span className="block text-muted-foreground">Strength</span>{result.item.product.hit_strength ?? "—"}/10</div><div className="rounded-xl border p-2"><span className="block text-muted-foreground">Puffs</span>{result.item.product.puff_count?.toLocaleString() ?? "—"}</div></div>
              {result.item.stock_status === "low_stock" && <p className="mt-3 text-xs text-amber-300">Low stock at this store</p>}
              <div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => onCompare(result.item)}>{compare.some((item) => item.id === result.item.id) ? <Check /> : <SlidersHorizontal />} Compare</Button><Button><Users /> Show employee</Button></div>
            </div>
          </CardContent>
        </Card>
      ))}
      <p className="text-center text-xs leading-5 text-muted-foreground">Product information comes from store and catalog records. Availability can change; ask an employee to confirm.</p>
    </div>
  );
}

function ChatView({ storeSlug, qrCode }: { storeSlug: string; qrCode: string }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "customer" | "assistant"; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const suggestions = ["Something sweet with strong ice", "What lasts the longest?", "Show me something under $25"];
  async function send(text = message) {
    if (!text.trim()) return;
    setMessages((current) => [...current, { role: "customer", text }]);
    setMessage("");
    setLoading(true);
    const response = await fetch("/api/customer/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storeSlug, qrCode, message: text }) });
    const result = await response.json() as { answer?: string; error?: string };
    setMessages((current) => [...current, { role: "assistant", text: result.answer ?? result.error ?? "I could not answer that right now." }]);
    setLoading(false);
  }
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col px-5 py-6">
      <div><p className="text-sm text-violet-300">Grounded in this store</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Ask AvaSmoke.Ai</h1></div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)} className="shrink-0 rounded-full border px-3 py-2 text-xs text-muted-foreground">{suggestion}</button>)}</div>
      <div className="flex-1 space-y-3 py-5">
        {!messages.length && <div className="rounded-2xl border bg-white/[.02] p-4 text-sm leading-6 text-muted-foreground">Ask about flavor, price, cooling, strength, or duration. Answers only use products currently available here.</div>}
        {messages.map((item, index) => <div key={index} className={cn("max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6", item.role === "customer" ? "ms-auto bg-violet-600 text-white" : "border bg-card")}>{item.text}</div>)}
        {loading && <div className="w-fit rounded-2xl border bg-card px-4 py-3"><Loader2 className="size-4 animate-spin" /></div>}
      </div>
      <div className="sticky bottom-3 flex gap-2 rounded-2xl border bg-[#120d1c]/95 p-2 backdrop-blur-xl"><Input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} placeholder="Ask about products in this store" className="h-11 border-0 bg-transparent" /><Button size="icon" className="size-11 shrink-0 rounded-xl" onClick={() => send()} aria-label="Send message"><ArrowRight /></Button></div>
    </div>
  );
}

function BrowseView({
  inventory,
  compare,
  onCompare,
}: {
  inventory: InventoryItem[];
  compare: InventoryItem[];
  onCompare: (item: InventoryItem) => void;
}) {
  const [query, setQuery] = useState("");
  const visible = inventory.filter((item) => `${item.product.brand_name} ${item.product.flavor_name} ${item.product.flavor_family}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="mx-auto max-w-4xl px-5 py-7">
      <h1 className="text-3xl font-semibold tracking-tight">Browse this store</h1>
      <p className="mt-2 text-sm text-muted-foreground">{visible.length} currently available products</p>
      <div className="relative mt-5"><Search className="absolute start-3 top-3.5 size-4 text-muted-foreground" /><Input className="h-11 ps-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Brand, flavor, or category" /></div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">{["Brand", "Flavor", "Cooling", "Price", "Staff picks"].map((filter) => <Button key={filter} variant="outline" size="sm" className="shrink-0">{filter}</Button>)}</div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map((item) => <ProductCard key={item.id} item={item} onCompare={() => onCompare(item)} />)}</div>
      {compare.length > 0 && <div className="sticky bottom-4 mx-auto mt-6 flex max-w-sm items-center justify-between rounded-2xl border bg-[#1a1228]/95 p-3 shadow-2xl backdrop-blur-xl"><span className="text-sm">{compare.length} selected to compare</span><Button size="sm">Compare</Button></div>}
    </div>
  );
}

function CameraView() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  return (
    <div className="mx-auto max-w-md px-5 py-7">
      <p className="text-sm text-violet-300">Photo search</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Find something similar</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Take a clear picture of your current product, package, or flavor label. Avoid images containing personal information.</p>
      <button onClick={() => input.current?.click()} className="mt-7 grid min-h-64 w-full place-items-center rounded-3xl border border-dashed border-violet-300/30 bg-violet-500/[.04] text-center">
        <div><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-300">{file ? <Check /> : <Camera />}</div><p className="mt-4 font-medium">{file ? file.name : "Take or upload a photo"}</p><p className="mt-2 text-xs text-muted-foreground">JPEG, PNG, or WebP · up to 8 MB</p></div>
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(event) => setFile(event.target.files?.[0])} />
      {file && <Button size="lg" className="mt-4 h-13 w-full rounded-2xl"><Sparkles /> Identify and search this store</Button>}
      <p className="mt-5 text-xs leading-5 text-muted-foreground">Results state confidence and offer possible matches when identification is uncertain. Images may be processed by the configured AI provider.</p>
    </div>
  );
}

function CompareView({ items }: { items: InventoryItem[] }) {
  return (
    <div className="overflow-x-auto px-5 py-7"><h1 className="text-3xl font-semibold tracking-tight">Compare products</h1>{items.length < 2 ? <p className="mt-4 text-sm text-muted-foreground">Choose at least two products from recommendations or store browsing.</p> : <table className="mt-7 min-w-[680px] w-full text-sm"><thead><tr><th className="p-3 text-left text-muted-foreground">Feature</th>{items.map((item) => <th key={item.id} className="p-3 text-left">{item.product.brand_name}<br />{item.product.flavor_name}</th>)}</tr></thead><tbody>{[["Price", (item: InventoryItem) => formatCurrency(item.sale_price ?? item.price)], ["Flavor", (item: InventoryItem) => item.product.flavor_family ?? "Unavailable"], ["Cooling", (item: InventoryItem) => `${item.product.cooling_level ?? "—"}/10`], ["Sweetness", (item: InventoryItem) => `${item.product.sweetness_level ?? "—"}/10`], ["Strength", (item: InventoryItem) => `${item.product.hit_strength ?? "—"}/10`], ["Puff count", (item: InventoryItem) => item.product.puff_count?.toLocaleString() ?? "Unavailable"], ["Rechargeable", (item: InventoryItem) => item.product.rechargeable ? "Yes" : "No"], ["Availability", (item: InventoryItem) => titleCase(item.stock_status)]].map(([label, getValue]) => <tr key={label as string} className="border-t"><td className="p-3 text-muted-foreground">{label as string}</td>{items.map((item) => <td key={item.id} className="p-3">{(getValue as (item: InventoryItem) => string)(item)}</td>)}</tr>)}</tbody></table>}</div>
  );
}

export function CustomerExperience({
  store,
  inventory,
  qrCode,
  developmentMode,
}: {
  store: Shop;
  inventory: InventoryItem[];
  qrCode: string;
  developmentMode: boolean;
}) {
  const [flow, setFlow] = useState<Flow>("location");
  const [locationLoading, setLocationLoading] = useState(false);
  const [distance, setDistance] = useState<number>();
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [compare, setCompare] = useState<InventoryItem[]>([]);

  async function verify(latitude: number, longitude: number) {
    const response = await fetch("/api/customer/verify-location", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storeSlug: store.slug, qrCode, latitude, longitude, permissionStatus: "granted" }) });
    const result = await response.json() as { verified?: boolean; distanceMiles?: number };
    setLocationLoading(false);
    setDistance(result.distanceMiles);
    setFlow(result.verified ? "age" : "blocked");
  }

  function locate() {
    setLocationLoading(true);
    if (!navigator.geolocation) { setLocationLoading(false); setFlow("denied"); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => verify(position.coords.latitude, position.coords.longitude),
      () => { setLocationLoading(false); setFlow("denied"); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  async function confirmAge(confirmed: boolean) {
    await fetch("/api/customer/age", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirmed }) });
    if (confirmed) {
      sessionStorage.setItem(`avasmoke-age-${qrCode}`, "true");
      setFlow("welcome");
    } else setFlow("underage");
  }

  async function findMatches(preferences: CustomerPreferences) {
    setFlow("results");
    setRecommendationLoading(true);
    const response = await fetch("/api/customer/recommendations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storeSlug: store.slug, qrCode, preferences }) });
    const result = await response.json() as { recommendations?: RecommendationResult[] };
    setRecommendations(result.recommendations ?? []);
    setRecommendationLoading(false);
  }

  function toggleCompare(item: InventoryItem) {
    setCompare((current) => current.some((value) => value.id === item.id) ? current.filter((value) => value.id !== item.id) : current.length < 3 ? [...current, item] : current);
  }

  const needsBack = !["location", "age", "blocked", "denied", "underage", "welcome"].includes(flow);
  const availableInventory = useMemo(() => inventory.filter((item) => item.product.active && ["in_stock", "low_stock"].includes(item.stock_status)), [inventory]);

  return (
    <main className="min-h-screen">
      <MobilePageHeader storeName={store.name} back={needsBack ? () => setFlow("welcome") : undefined} />
      {flow === "location" && <LocationPermissionCard store={store} loading={locationLoading} onAllow={locate} developmentMode={developmentMode} onTest={() => { setLocationLoading(true); verify(store.latitude, store.longitude); }} />}
      {flow === "denied" && <div className="mx-auto max-w-md px-5 py-16 text-center"><MapPin className="mx-auto size-12 text-violet-300" /><h1 className="mt-5 text-2xl font-semibold">Location is required</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Enable location access in your browser settings so we can verify this store-specific experience.</p><Button className="mt-7 w-full" onClick={locate}><RotateCcw /> Try again</Button></div>}
      {flow === "blocked" && <div className="mx-auto max-w-md px-5 py-16 text-center"><MapPin className="mx-auto size-12 text-violet-300" /><h1 className="mt-5 text-2xl font-semibold">Visit {store.name} to continue</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">This AvaSmoke.Ai experience is available while visiting {store.name}. {distance != null && `You appear to be ${distance} miles away.`}</p><div className="mt-7 grid gap-3"><Button asChild><a href={`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`} target="_blank" rel="noreferrer"><Compass /> Get Directions</a></Button><Button variant="outline" onClick={locate}><RotateCcw /> Try Again</Button></div><p className="mt-5 text-xs text-muted-foreground">We store only the calculated distance and verification result, not your precise coordinates.</p></div>}
      {flow === "age" && <AgeGate onConfirm={() => confirmAge(true)} onDecline={() => confirmAge(false)} />}
      {flow === "underage" && <div className="mx-auto max-w-md px-5 py-20 text-center"><ShieldCheck className="mx-auto size-11 text-muted-foreground" /><h1 className="mt-5 text-2xl font-semibold">Access unavailable</h1><p className="mt-3 text-sm text-muted-foreground">AvaSmoke.Ai is only available to adults 21 or older.</p></div>}
      {flow === "welcome" && <div className="mx-auto max-w-lg px-5 py-9"><p className="text-sm text-violet-300">Welcome to AvaSmoke.Ai</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.045em]">Find something available at {store.name}.</h1><div className="mt-8 grid gap-3 sm:grid-cols-2">{[[Sparkles, "Find My Match", "A few quick choices", "match"], [MessageCircle, "Ask AvaSmoke.Ai", "Type what you want", "chat"], [Camera, "Take a Picture", "Find a similar product", "camera"], [ShoppingBag, "Browse This Store", `${availableInventory.length} available products`, "browse"]].map(([Icon, title, note, target]) => <button key={title as string} onClick={() => setFlow(target as Flow)} className="flex min-h-28 items-center gap-4 rounded-3xl border bg-card/70 p-5 text-left transition hover:border-violet-300/35 hover:bg-card"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300">{<Icon className="size-5" />}</div><div><p className="font-medium">{title as string}</p><p className="mt-1 text-xs text-muted-foreground">{note as string}</p></div><ChevronRight className="ms-auto size-4 text-muted-foreground" /></button>)}</div><p className="mt-8 text-center text-xs text-muted-foreground">Adult-use retail guidance only · Ask store staff to confirm product details</p></div>}
      {flow === "match" && <MatchFlow inventory={availableInventory} onComplete={findMatches} />}
      {flow === "results" && <RecommendationResults results={recommendations} loading={recommendationLoading} compare={compare} onCompare={toggleCompare} />}
      {flow === "browse" && <BrowseView inventory={availableInventory} compare={compare} onCompare={toggleCompare} />}
      {flow === "chat" && <ChatView storeSlug={store.slug} qrCode={qrCode} />}
      {flow === "camera" && <CameraView />}
      {flow === "compare" && <CompareView items={compare} />}
      {compare.length >= 2 && !["compare", "location", "age", "blocked", "denied"].includes(flow) && <Button className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full shadow-2xl" onClick={() => setFlow("compare")}><SlidersHorizontal /> Compare {compare.length}</Button>}
    </main>
  );
}
