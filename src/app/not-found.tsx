import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-24">
      <ErrorState
        title="Page not found"
        description="The link may have changed or the QR code may no longer be active."
      />
      <Button asChild className="mx-auto mt-5 flex w-fit">
        <Link href="/">Return home</Link>
      </Button>
    </main>
  );
}
