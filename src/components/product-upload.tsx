"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  ImagePlus,
  Loader2,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ExtractedProduct } from "@/lib/ai/services";

type ReviewedProduct = ExtractedProduct & { selected: boolean };

export function ProductUploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [products, setProducts] = useState<ReviewedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"live" | "mock">();
  const [error, setError] = useState<string>();

  function receiveFiles(list: FileList | null) {
    const accepted = Array.from(list ?? []).filter((file) =>
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    );
    setFiles((current) => [...current, ...accepted].slice(0, 12));
  }

  async function extract() {
    if (!files.length) return;
    setLoading(true);
    setError(undefined);
    const body = new FormData();
    files.forEach((file) => body.append("images", file));
    const response = await fetch("/api/ai/extract-products", {
      method: "POST",
      body,
    });
    const result = (await response.json()) as {
      error?: string;
      mode?: "live" | "mock";
      products?: ExtractedProduct[];
    };
    setLoading(false);
    if (!response.ok || !result.products) {
      setError(result.error ?? "Image extraction failed.");
      return;
    }
    setMode(result.mode);
    setProducts(
      result.products.map((product) => ({ ...product, selected: true })),
    );
  }

  return (
    <Tabs defaultValue="photos" className="space-y-6">
      <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl">
        <TabsTrigger value="photos" className="min-h-11">
          <ImagePlus /> Photos
        </TabsTrigger>
        <TabsTrigger value="search" className="min-h-11">
          <Search /> Catalog
        </TabsTrigger>
        <TabsTrigger value="manual" className="min-h-11">
          <Check /> Manual
        </TabsTrigger>
      </TabsList>
      <TabsContent value="photos" className="space-y-5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={(event) => {
            event.preventDefault();
            receiveFiles(event.dataTransfer.files);
          }}
          onDragOver={(event) => event.preventDefault()}
          className="flex min-h-56 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-violet-300/25 bg-violet-500/[.035] px-5 text-center transition hover:border-violet-300/50 hover:bg-violet-500/[.06]"
        >
          <div className="grid size-12 place-items-center rounded-2xl bg-violet-500/12 text-violet-300">
            <UploadCloud />
          </div>
          <p className="mt-4 font-medium">Drop product or shelf photos here</p>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Upload up to 12 JPEG, PNG, or WebP images. AI suggestions always
            require review before publishing.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm text-violet-300">
            <Camera className="size-4" /> Choose files or use camera
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          multiple
          className="hidden"
          onChange={(event) => receiveFiles(event.target.files)}
        />
        {files.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
            <p className="text-sm">
              {files.length} image{files.length === 1 ? "" : "s"} ready
            </p>
            <Button onClick={extract} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {loading ? "Analyzing…" : "Extract product details"}
            </Button>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {mode === "mock" && (
          <Alert>
            <AlertTriangle />
            <AlertDescription>
              Mock extraction mode is active. Configure AI_PROVIDER, AI_MODEL,
              and a server-only provider key for vision extraction.
            </AlertDescription>
          </Alert>
        )}
        {products.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Review extracted products</h3>
                <p className="text-sm text-muted-foreground">
                  Correct uncertain details before adding inventory.
                </p>
              </div>
              <Button variant="outline" size="sm">
                Select all
              </Button>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {products.map((product, index) => (
                <Card key={index} className="rounded-2xl bg-card/70">
                  <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input defaultValue={product.brand ?? ""} placeholder="Required" />
                    </div>
                    <div className="space-y-2">
                      <Label>Product line</Label>
                      <Input defaultValue={product.productLine ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>Flavor</Label>
                      <Input defaultValue={product.flavor ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label>Puff count</Label>
                      <Input type="number" defaultValue={product.puffCount ?? ""} />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={
                          product.confidence >= 0.8
                            ? "text-emerald-300"
                            : "text-amber-300"
                        }
                      >
                        {Math.round(product.confidence * 100)}% confidence
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Admin confirmation required
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="sticky bottom-4 flex justify-end">
              <Button size="lg" className="rounded-xl shadow-2xl">
                Confirm and add selected products
              </Button>
            </div>
          </div>
        )}
      </TabsContent>
      <TabsContent value="search">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <Label htmlFor="catalog-search">Brand, flavor, product, barcode, or SKU</Label>
            <div className="mt-3 flex gap-2">
              <Input id="catalog-search" className="h-11" placeholder="Try “mango strong ice”" />
              <Button className="h-11">Search catalog</Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Matching master products appear here with duplicate warnings and
              store assignment controls.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="manual">
        <Card className="rounded-2xl">
          <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
            {["Brand", "Product name", "Flavor", "Category", "Puff count", "Nicotine percentage"].map(
              (label) => (
                <div className="space-y-2" key={label}>
                  <Label>{label}</Label>
                  <Input />
                </div>
              ),
            )}
            <Button className="sm:col-span-2">Review manual product</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
