import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MapPin,
  ScanLine,
  Sparkles,
} from "lucide-react";

import { AvaSmokeWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isDevelopmentFallback } from "@/lib/env";

const proof = [
  {
    icon: MapPin,
    title: "Store verified",
    text: "Recommendations unlock only inside the store’s configured radius.",
  },
  {
    icon: ScanLine,
    title: "Inventory grounded",
    text: "Only active, available inventory from the scanned location is eligible.",
  },
  {
    icon: BarChart3,
    title: "Demand intelligence",
    text: "See requests, product interest, and gaps without storing precise location.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <AvaSmokeWordmark className="text-xl" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Admin login</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/apply">Apply for access</Link>
          </Button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.12fr_.88fr] lg:items-center lg:pt-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/5 px-3 py-1.5 text-sm text-violet-200">
            <Sparkles className="size-4" />
            Digital product guidance, grounded in your shelves
          </div>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-7xl">
            Help customers find the right in-store product.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            One QR code opens a fast, adult-only recommendation experience
            powered by the inventory available at that exact location.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="h-12 rounded-full px-7">
              <Link href="/apply">
                Bring AvaSmoke.Ai to your store
                <ArrowRight />
              </Link>
            </Button>
            {isDevelopmentFallback && (
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full px-7"
              >
                <Link href="/app/store/northstar-smoke-vape?qr=demo-northstar">
                  Open customer demo
                </Link>
              </Button>
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {["No customer account", "No app download", "Privacy-conscious"].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-violet-300" />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-12 rounded-full bg-violet-600/20 blur-[90px]" />
          <Card className="glass relative overflow-hidden rounded-[2rem] border-violet-300/15 py-0">
            <CardContent className="p-5 sm:p-7">
              <div className="mb-10 flex items-center justify-between">
                <AvaSmokeWordmark className="text-lg" />
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                  Location verified
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Northstar Smoke & Vape
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                What sounds good today?
              </h2>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {["Best flavor", "Strongest hit", "Most cooling", "Best value"].map(
                  (choice, index) => (
                    <div
                      key={choice}
                      className={`rounded-2xl border p-4 text-sm ${
                        index === 0
                          ? "border-violet-400/60 bg-violet-500/15 text-white"
                          : "bg-white/[.025] text-muted-foreground"
                      }`}
                    >
                      {choice}
                    </div>
                  ),
                )}
              </div>
              <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-400" />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                2 of 5 · About 30 seconds
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-y border-violet-300/10 bg-white/[.015]">
        <div className="mx-auto grid max-w-7xl gap-5 px-5 py-10 sm:px-8 lg:grid-cols-3">
          {proof.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl p-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
                <Icon className="size-5" />
              </div>
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
