import Link from "next/link";
import { QrCode, RotateCcw } from "lucide-react";

import { AvaSmokeWordmark } from "@/components/brand";
import { CustomerExperience } from "@/components/customer-experience";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStorefront, toCustomerStore } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StoreExperiencePage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string; flow?: string[] }>;
  searchParams: Promise<{ qr?: string }>;
}) {
  const { storeSlug } = await params;
  const { qr } = await searchParams;
  const storefront = await getStorefront(storeSlug, qr);

  if (!storefront) {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <Card className="glass w-full max-w-md rounded-3xl">
          <CardContent className="p-7 text-center">
            <AvaSmokeWordmark className="text-xl" />
            <div className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-300">
              <QrCode />
            </div>
            <h1 className="mt-5 text-2xl font-semibold">
              This QR experience is unavailable
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The code may be invalid, disabled, or assigned to a store that is
              not currently active. Please ask a store employee for help.
            </p>
            <Button className="mt-7 w-full" asChild>
              <Link href="/">
                <RotateCcw /> Return to AvaSmoke.Ai
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <CustomerExperience
      store={toCustomerStore(storefront.shop)}
      qrCode={storefront.qrCode.code}
      developmentMode={storefront.developmentMode}
    />
  );
}
