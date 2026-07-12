import { NextResponse } from "next/server";
import { z } from "zod";

import { isDevelopmentFallback } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const applicationSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  applicantName: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(8).max(300),
  numberOfLocations: z.coerce.number().int().min(1).max(1000),
  websiteOrSocial: z.union([z.url(), z.literal("")]).optional(),
  message: z.string().trim().max(2000).optional(),
  companyWebsite: z.string().max(0),
});

export async function POST(request: Request) {
  const parsed = applicationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid application." },
      { status: 400 },
    );
  }

  if (isDevelopmentFallback) {
    return NextResponse.json({ accepted: true, developmentMode: true });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Application service is not configured." },
      { status: 503 },
    );
  }

  const value = parsed.data;
  const { error } = await supabase.from("shop_applications").insert({
    business_name: value.businessName,
    applicant_name: value.applicantName,
    email: value.email.toLowerCase(),
    phone: value.phone,
    address: value.address,
    number_of_locations: value.numberOfLocations,
    website_or_social: value.websiteOrSocial || null,
    message: value.message || null,
  });

  if (error) {
    const rateLimited = error.message.toLowerCase().includes("policy");
    return NextResponse.json(
      {
        error: rateLimited
          ? "An application was recently submitted for this email. Please try again later."
          : "We could not submit the application.",
      },
      { status: rateLimited ? 429 : 500 },
    );
  }

  return NextResponse.json({ accepted: true }, { status: 201 });
}
