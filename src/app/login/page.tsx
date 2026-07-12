import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { AvaSmokeWordmark } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDevelopmentFallback } from "@/lib/env";

export const metadata = { title: "Admin login" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center">
          <AvaSmokeWordmark className="text-2xl" />
        </Link>
        <Card className="glass rounded-3xl">
          <CardHeader className="space-y-3 px-6 pt-7">
            <div className="grid size-11 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
              <ShieldCheck className="size-5" />
            </div>
            <CardTitle className="text-2xl">Platform admin</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Sign in with your approved AvaSmoke.Ai administrator account.
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-7">
            {isDevelopmentFallback ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-sm text-amber-100">
                  Development preview mode is active because Supabase is not
                  configured.
                </div>
                <a
                  href="/admin"
                  className="flex h-12 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium"
                >
                  Open development dashboard
                </a>
              </div>
            ) : (
              <LoginForm />
            )}
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
          Protected by Supabase Authentication and role-based database policies.
        </p>
      </div>
    </main>
  );
}
