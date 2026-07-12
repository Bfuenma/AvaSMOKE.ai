"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function signIn(formData: FormData) {
    setLoading(true);
    setError(undefined);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured. Add the public URL and publishable key.");
      setLoading(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email")),
      password: String(formData.get("password")),
    });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  async function resetPassword() {
    const email = (
      document.querySelector<HTMLInputElement>("#email")?.value ?? ""
    ).trim();
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/login?reset=true` },
    );
    if (resetError) setError(resetError.message);
    else setMessage("Check your email for a secure password reset link.");
  }

  return (
    <form action={signIn} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            onClick={resetPassword}
            className="text-xs text-violet-300 hover:text-violet-200"
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
          required
          className="h-12"
        />
      </div>
      <Button disabled={loading} className="h-12 w-full rounded-xl">
        {loading ? <Loader2 className="animate-spin" /> : "Sign in securely"}
        {!loading && <ArrowRight />}
      </Button>
    </form>
  );
}
