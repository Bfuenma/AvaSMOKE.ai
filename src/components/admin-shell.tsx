"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  Bot,
  ChevronLeft,
  CircleUserRound,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  PackageSearch,
  QrCode,
  Settings,
  SlidersHorizontal,
  Store,
  Upload,
  Users,
} from "lucide-react";

import { AvaSmokeWordmark } from "@/components/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navigation = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/stores", "Stores", Store],
  ["/admin/inventory", "Inventory", Boxes],
  ["/admin/products", "Product Catalog", PackageSearch],
  ["/admin/upload", "Upload Products", Upload],
  ["/admin/qr-codes", "QR Codes", QrCode],
  ["/admin/applications", "Applications", ClipboardList],
  ["/admin/conversations", "Conversations", MessageSquareText],
  ["/admin/analytics", "Analytics", BarChart3],
  ["/admin/ai-settings", "AI Settings", Bot],
  ["/admin/users", "Users", Users],
  ["/admin/settings", "System Settings", Settings],
] as const;

function NavItems({
  collapsed,
  close,
}: {
  collapsed: boolean;
  close?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1.5" aria-label="Admin navigation">
      {navigation.map(([href, label, Icon]) => {
        const active =
          href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={close}
            title={collapsed ? label : undefined}
            className={cn(
              "flex h-10 items-center gap-3 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white",
              active && "bg-violet-500/12 text-violet-100",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-[18px] shrink-0" />
            {!collapsed && <span>{label}</span>}
            {label === "Applications" && !collapsed && (
              <Badge className="ms-auto h-5 bg-violet-500/15 text-violet-200">
                1
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  children,
  identity,
}: {
  children: React.ReactNode;
  identity: { fullName: string; email: string; preview: boolean };
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await createSupabaseBrowserClient()?.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-30 hidden border-e bg-[#0d0913]/95 px-3 py-5 backdrop-blur-xl transition-[width] lg:flex lg:flex-col",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div
          className={cn(
            "mb-7 flex h-9 items-center px-2",
            collapsed && "justify-center px-0",
          )}
        >
          {collapsed ? (
            <span className="text-xl font-semibold text-violet-300">A.</span>
          ) : (
            <AvaSmokeWordmark className="text-xl" />
          )}
        </div>
        <NavItems collapsed={collapsed} />
        <div className="mt-auto space-y-2">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={() => setCollapsed((value) => !value)}
            className={cn("w-full text-muted-foreground", !collapsed && "justify-start")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("transition-transform", collapsed && "rotate-180")} />
            {!collapsed && "Collapse"}
          </Button>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={logout}
            className={cn("w-full text-muted-foreground", !collapsed && "justify-start")}
          >
            <LogOut />
            {!collapsed && "Log out"}
          </Button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-[#08060d]/88 px-4 backdrop-blur-xl lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-[#0d0913] p-4">
            <SheetTitle className="mb-7 text-left">
              <AvaSmokeWordmark className="text-xl" />
            </SheetTitle>
            <NavItems collapsed={false} close={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <AvaSmokeWordmark className="text-lg" />
        <CircleUserRound className="size-5 text-muted-foreground" />
      </header>

      <main
        className={cn(
          "transition-[padding] lg:min-h-screen",
          collapsed ? "lg:ps-[76px]" : "lg:ps-64",
        )}
      >
        {identity.preview && (
          <div className="border-b border-amber-300/15 bg-amber-300/[.06] px-5 py-2 text-center text-xs text-amber-100">
            Development preview · Connect Supabase to enable persistent admin data
          </div>
        )}
        <div className="mx-auto max-w-[1600px] p-5 sm:p-7 lg:p-9">{children}</div>
      </main>
    </div>
  );
}
