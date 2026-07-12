import Link from "next/link";

import { AvaSmokeWordmark } from "@/components/brand";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-10 sm:py-16">
      <Link href="/"><AvaSmokeWordmark className="text-xl" /></Link>
      <h1 className="mt-14 text-4xl font-semibold tracking-tight">Privacy notice</h1>
      <p className="mt-3 text-sm text-muted-foreground">Concise product notice · Version 1</p>
      <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground">
        <section><h2 className="text-lg font-medium text-white">Location verification</h2><p className="mt-2">Your location is used to verify proximity to the store connected to a QR code. By default, AvaSmoke.Ai stores only the calculated distance and verification result—not precise coordinates.</p></section>
        <section><h2 className="text-lg font-medium text-white">Anonymous interactions</h2><p className="mt-2">Anonymous scans, preference choices, recommendations, and optional feedback may be used to provide store analytics and improve inventory insights. A customer account is not required.</p></section>
        <section><h2 className="text-lg font-medium text-white">Product photos</h2><p className="mt-2">Photos may be processed by the configured AI provider to identify products and find store inventory matches. Avoid uploading images that contain faces, addresses, payment details, or other personal information.</p></section>
        <section><h2 className="text-lg font-medium text-white">Adult access</h2><p className="mt-2">A simple session-level age confirmation is stored. AvaSmoke.Ai does not request identification in this version.</p></section>
        <section><h2 className="text-lg font-medium text-white">Retention and controls</h2><p className="mt-2">Retention settings are designed to be configurable as the platform expands. Store operators receive aggregated operational insights; exact customer coordinates are not included.</p></section>
      </div>
    </main>
  );
}
