import "server-only";

import { redirect } from "next/navigation";

import { isDevelopmentFallback, isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminIdentity {
  id: string;
  email: string;
  fullName: string;
  role: "platform_admin";
  preview: boolean;
}

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  if (!isSupabaseConfigured) {
    return isDevelopmentFallback
      ? {
          id: "development-admin",
          email: "development@avasmoke.ai",
          fullName: "Development Admin",
          role: "platform_admin",
          preview: true,
        }
      : null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, status")
    .eq("id", userId)
    .eq("role", "platform_admin")
    .eq("status", "active")
    .maybeSingle();

  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name ?? profile.email,
    role: "platform_admin",
    preview: false,
  };
}

export async function requireAdmin() {
  const identity = await getAdminIdentity();
  if (!identity) redirect("/login");
  return identity;
}
