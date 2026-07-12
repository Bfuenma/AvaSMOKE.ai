import Link from "next/link";
import { BarChart3, Check, QrCode, Store } from "lucide-react";

import { ApplicationForm } from "@/components/application-form";
import { AvaSmokeWordmark } from "@/components/brand";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Apply" };

const benefits = [
  [QrCode, "A unique QR experience for every approved location"],
  [Store, "Recommendations grounded in your store inventory"],
  [BarChart3, "Analytics and inventory opportunity insights"],
] as const;

export default function ApplyPage() {
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/">
          <AvaSmokeWordmark className="text-xl" />
        </Link>
        <div className="mt-12 grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div className="lg:pt-10">
            <p className="text-sm font-medium text-violet-300">For retailers</p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Bring AvaSmoke.Ai to Your Store
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Give adult customers a faster way to discover products you
              actually carry.
            </p>
            <div className="mt-9 space-y-5">
              {benefits.map(([Icon, text]) => (
                <div key={text} className="flex items-center gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
                    <Icon className="size-5" />
                  </div>
                  <span className="text-sm leading-6">{text}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border bg-white/[.02] p-5 text-sm leading-6 text-muted-foreground">
              <p className="flex gap-2 text-white">
                <Check className="mt-1 size-4 text-emerald-400" />
                Every application is reviewed before access is granted.
              </p>
              <p className="mt-2 pl-6">
                We do not automatically create active shop accounts.
              </p>
            </div>
          </div>
          <Card className="glass rounded-3xl">
            <CardContent className="p-6 sm:p-8">
              <ApplicationForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
