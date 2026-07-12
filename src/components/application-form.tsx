"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const fields = [
  ["businessName", "Business name", "text", true],
  ["applicantName", "Applicant name", "text", true],
  ["email", "Email", "email", true],
  ["phone", "Phone", "tel", true],
  ["address", "Store address", "text", true],
  ["numberOfLocations", "Number of locations", "number", true],
  ["websiteOrSocial", "Website or social media", "url", false],
] as const;

export function ApplicationForm() {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(formData: FormData) {
    setLoading(true);
    setError(undefined);
    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(result.error ?? "We could not submit your application.");
      return;
    }
    setComplete(true);
  }

  if (complete) {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-emerald-400" />
        <h2 className="mt-5 text-2xl font-semibold">Application received</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          Our team will review your store details. No account has been created
          yet; approved applicants will receive next steps.
        </p>
      </div>
    );
  }

  return (
    <form action={submit} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([name, label, type, required]) => (
          <div
            className={`space-y-2 ${name === "address" ? "sm:col-span-2" : ""}`}
            key={name}
          >
            <Label htmlFor={name}>{label}</Label>
            <Input
              id={name}
              name={name}
              type={type}
              required={required}
              min={type === "number" ? 1 : undefined}
              max={type === "number" ? 1000 : undefined}
              className="h-11"
            />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Tell us about your store</Label>
        <Textarea id="message" name="message" rows={4} maxLength={2000} />
      </div>
      <input
        name="companyWebsite"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <Button disabled={loading} className="h-12 w-full rounded-xl">
        {loading && <Loader2 className="animate-spin" />}
        {loading ? "Submitting…" : "Submit for review"}
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        Submission does not create an account or guarantee approval.
      </p>
    </form>
  );
}
