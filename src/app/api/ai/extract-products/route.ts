import { NextResponse } from "next/server";

import { extractProductsFromImages } from "@/lib/ai/services";
import { getAdminIdentity } from "@/lib/auth";
import { isDevelopmentFallback } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await getAdminIdentity();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("images").filter((entry): entry is File => entry instanceof File);
  if (!files.length || files.length > 12) {
    return NextResponse.json(
      { error: "Upload between 1 and 12 images." },
      { status: 400 },
    );
  }
  if (files.some((file) => !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES)) {
    return NextResponse.json(
      { error: "Images must be JPEG, PNG, or WebP and no larger than 8 MB." },
      { status: 400 },
    );
  }

  if (isDevelopmentFallback) {
    const result = await extractProductsFromImages(files.map((file) => `https://development.invalid/${encodeURIComponent(file.name)}`));
    return NextResponse.json(result);
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "Secure upload service is not configured." }, { status: 503 });
  }

  const jobId = crypto.randomUUID();
  const urls: string[] = [];
  const paths: string[] = [];
  for (const file of files) {
    const extension = file.type.split("/")[1] ?? "jpg";
    const path = `${admin.id}/${jobId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("product-uploads")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      if (paths.length) {
        await supabase.storage.from("product-uploads").remove(paths);
      }
      return NextResponse.json({ error: "A product image could not be stored." }, { status: 500 });
    }
    paths.push(path);
    const { data } = await supabase.storage
      .from("product-uploads")
      .createSignedUrl(path, 900);
    if (data?.signedUrl) urls.push(data.signedUrl);
  }

  const { data: job, error: jobError } = await supabase
    .from("product_upload_jobs")
    .insert({
      id: jobId,
      uploaded_by: admin.id,
      image_urls: urls,
      extraction_status: "processing",
    })
    .select("id")
    .single();
  if (jobError || !job) {
    await supabase.storage.from("product-uploads").remove(paths);
    return NextResponse.json(
      { error: "The extraction job could not be created." },
      { status: 503 },
    );
  }

  try {
    const result = await extractProductsFromImages(urls);
    await supabase
      .from("product_upload_jobs")
      .update({
        extraction_status: "review_required",
        extracted_data: result.products,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return NextResponse.json(result);
  } catch {
    await supabase
      .from("product_upload_jobs")
      .update({
        extraction_status: "failed",
        error_message: "AI extraction failed.",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    return NextResponse.json({ error: "AI extraction is temporarily unavailable." }, { status: 503 });
  }
}
