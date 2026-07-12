import { notFound } from "next/navigation";

import { AdminSection } from "@/components/admin-sections";
import { isDevelopmentFallback } from "@/lib/env";

const sections = new Set([
  "stores",
  "inventory",
  "products",
  "upload",
  "qr-codes",
  "applications",
  "conversations",
  "analytics",
  "ai-settings",
  "users",
  "settings",
]);

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!sections.has(section)) notFound();
  return (
    <AdminSection
      section={section}
      developmentMode={isDevelopmentFallback}
    />
  );
}
