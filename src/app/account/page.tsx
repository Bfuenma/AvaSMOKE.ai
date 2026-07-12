import Link from "next/link";
import { Clock3 } from "lucide-react";

import { AvaSmokeWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Shop account" };

export default function ShopAccountPlaceholder() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <Card className="glass w-full max-w-lg rounded-3xl">
        <CardContent className="p-8 text-center">
          <AvaSmokeWordmark className="text-xl" />
          <div className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-violet-500/10 text-violet-300"><Clock3 /></div>
          <h1 className="mt-5 text-2xl font-semibold">Shop access is invitation-only</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Applications are reviewed before a store or owner account is activated. The full shop-owner portal is planned for a later phase.</p>
          <Button className="mt-7" asChild><Link href="/apply">Apply for access</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
