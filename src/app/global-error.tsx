"use client";

import { ErrorState } from "@/components/states";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#08060d] p-5 text-white">
        <ErrorState
          title="AvaSmoke.Ai could not load"
          description="Check your connection and try again. If the problem continues, ask store staff for help."
          retry={reset}
        />
      </body>
    </html>
  );
}
