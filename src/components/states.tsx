import { AlertTriangle, Inbox, Loader2 } from "lucide-react";

import { AvaSmokeWordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LoadingState({ label = "Loading AvaSmoke.Ai" }: { label?: string }) {
  return (
    <div className="grid min-h-[50vh] place-items-center text-center" role="status">
      <div><AvaSmokeWordmark className="text-xl" /><Loader2 className="mx-auto mt-6 size-6 animate-spin text-violet-300" /><p className="mt-3 text-sm text-muted-foreground">{label}</p></div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="rounded-2xl bg-card/70"><CardContent className="p-10 text-center"><Inbox className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-medium">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p></CardContent></Card>
  );
}

export function ErrorState({ title = "Something went wrong", description, retry }: { title?: string; description: string; retry?: () => void }) {
  return (
    <Card className="rounded-2xl bg-card/70"><CardContent className="p-10 text-center"><AlertTriangle className="mx-auto size-9 text-amber-300" /><h2 className="mt-4 font-medium">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>{retry && <Button className="mt-5" onClick={retry}>Try again</Button>}</CardContent></Card>
  );
}
