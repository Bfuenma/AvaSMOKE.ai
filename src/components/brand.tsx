"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function AvaSmokeWordmark({
  className,
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <span
      className={cn(
        "font-semibold tracking-[-0.045em]",
        animated && "wordmark-shine",
        className,
      )}
      aria-label="AvaSmoke.Ai"
    >
      AvaSmoke<span className="brand-dot">.</span>Ai
    </span>
  );
}

export function PurpleGlowBackground({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden purple-grid",
        className,
      )}
    >
      <div className="absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-violet-700/10 blur-[110px]" />
    </div>
  );
}

export function BrandIntroAnimation() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("avasmoke-intro-seen")) return;
    setVisible(true);
    const timeout = window.setTimeout(() => {
      sessionStorage.setItem("avasmoke-intro-seen", "true");
      setVisible(false);
    }, 1800);
    return () => window.clearTimeout(timeout);
  }, []);

  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#07050b]"
      role="status"
      aria-label="Loading AvaSmoke.Ai"
    >
      <div
        aria-hidden="true"
        className="brand-intro-glow absolute h-72 w-72 rounded-full bg-violet-600/50 blur-[90px]"
      />
      <div className="brand-intro-word brand-intro-sweep relative overflow-hidden px-8 py-4 text-4xl sm:text-5xl">
        <AvaSmokeWordmark animated={false} />
      </div>
    </div>
  );
}
