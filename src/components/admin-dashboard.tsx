"use client";

import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  MessageSquareText,
  QrCode,
  Sparkles,
  Store,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { InventoryItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  metrics: {
    activeStores: number;
    pendingApplications: number;
    totalScans: number;
    verifiedSessions: number;
    conversations: number;
    recommendations: number;
  };
  stores: Array<{ name: string; scans: number; conversion: number }>;
  scanSeries: number[];
  topProducts: InventoryItem[];
}

export function MetricCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-2xl bg-card/70">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="grid size-9 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
            <Icon className="size-[18px]" />
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-sm">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{note}</p>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard({ data }: { data: DashboardData }) {
  const chartData = data.scanSeries.map((scans, index) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index],
    scans,
  }));
  const verifiedRate = data.metrics.totalScans
    ? Math.round((data.metrics.verifiedSessions / data.metrics.totalScans) * 100)
    : 0;

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-violet-300">Platform overview</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Good afternoon
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Store activity and customer intent across AvaSmoke.Ai.
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-emerald-300/20 text-emerald-300">
          <span className="me-2 size-1.5 rounded-full bg-emerald-400" />
          Systems operational
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Active stores" value={data.metrics.activeStores} note={`${data.metrics.pendingApplications} pending`} icon={Store} />
        <MetricCard label="QR scans" value={data.metrics.totalScans.toLocaleString()} note="All active codes" icon={QrCode} />
        <MetricCard label="Verified sessions" value={data.metrics.verifiedSessions.toLocaleString()} note={`${verifiedRate}% of scans`} icon={CheckCircle2} />
        <MetricCard label="Conversations" value={data.metrics.conversations.toLocaleString()} note="Customer messages" icon={MessageSquareText} />
        <MetricCard label="Recommendations" value={data.metrics.recommendations.toLocaleString()} note="Top-three results" icon={Sparkles} />
        <MetricCard label="Inventory gaps" value="18" note="5 high-frequency" icon={Boxes} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="rounded-2xl bg-card/70">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily scans</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Last seven days</p>
              </div>
              <Badge variant="secondary">+12.4%</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-72 ps-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 16, right: 16, top: 10 }}>
                <defs>
                  <linearGradient id="scans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9333ea" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(192,132,252,.08)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#aaa0b8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "#1a1228", border: "1px solid rgba(192,132,252,.18)", borderRadius: 12 }}
                />
                <Area dataKey="scans" type="monotone" stroke="#a855f7" strokeWidth={2} fill="url(#scans)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-card/70">
          <CardHeader>
            <CardTitle>Top stores</CardTitle>
            <p className="text-sm text-muted-foreground">Verified recommendation completion</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.stores.length ? data.stores.map((store) => (
              <div key={store.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{store.name}</span>
                  <span className="text-muted-foreground">{store.conversion}%</span>
                </div>
                <Progress value={store.conversion} />
                <p className="mt-1.5 text-xs text-muted-foreground">{store.scans.toLocaleString()} scans</p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">Store rankings appear after verified sessions.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-2xl bg-card/70">
          <CardHeader>
            <CardTitle>Most recommended products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topProducts.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 rounded-xl border bg-white/[.015] p-3">
                <span className="grid size-8 place-items-center rounded-lg bg-violet-500/10 text-xs text-violet-200">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.product.brand_name} {item.product.flavor_name}</p>
                  <p className="text-xs text-muted-foreground">{item.product.flavor_family}</p>
                </div>
                <span className="text-sm">{formatCurrency(item.sale_price ?? item.price)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-card/70">
          <CardHeader>
            <CardTitle>Inventory Opportunities</CardTitle>
            <p className="text-sm text-muted-foreground">Unmet demand with sufficient signal</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Mango · strong cooling", 42, "1 current match"],
              ["Dessert · smooth", 27, "No current match"],
              ["Under $20 · tropical", 21, "2 low-stock matches"],
            ].map(([request, count, note]) => (
              <div key={request} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div>
                  <p className="text-sm">{request}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{note}</p>
                </div>
                <Badge variant="secondary">{count} requests</Badge>
              </div>
            ))}
            <p className="text-xs leading-5 text-muted-foreground">
              Insights describe observed requests only. No revenue impact is estimated.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
