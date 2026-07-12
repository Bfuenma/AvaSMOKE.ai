"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Copy, Download, Power, QrCode as QrIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function QRCodeCard({
  label,
  path,
  active,
  scans,
}: {
  label: string;
  path: string;
  active: boolean;
  scans: number;
}) {
  const [png, setPng] = useState<string>();
  const url =
    typeof window === "undefined"
      ? path
      : new URL(path, window.location.origin).toString();

  useEffect(() => {
    QRCode.toDataURL(new URL(path, window.location.origin).toString(), {
      width: 640,
      margin: 2,
      color: { dark: "#120d1c", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setPng);
  }, [path]);

  async function downloadSvg() {
    const svg = await QRCode.toString(url, {
      type: "svg",
      color: { dark: "#120d1c", light: "#ffffff" },
      errorCorrectionLevel: "H",
    });
    const href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `${label.toLowerCase().replaceAll(" ", "-")}.svg`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <Card className="rounded-2xl bg-card/70">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row">
        <div className="grid size-36 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-2">
          {png ? (
            <Image src={png} alt={`QR code for ${label}`} width={128} height={128} unoptimized />
          ) : (
            <QrIcon className="size-10 text-black/30" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{label}</h3>
            <Badge variant="outline" className={active ? "text-emerald-300" : "text-muted-foreground"}>
              {active ? "Active" : "Disabled"}
            </Badge>
          </div>
          <p className="mt-2 truncate font-mono text-xs text-muted-foreground">{path}</p>
          <p className="mt-4 text-sm">{scans.toLocaleString()} scans</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(url)}>
              <Copy /> Copy link
            </Button>
            {png && (
              <Button size="sm" variant="outline" asChild>
                <a href={png} download={`${label.toLowerCase().replaceAll(" ", "-")}.png`}>
                  <Download /> PNG
                </a>
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={downloadSvg}>
              <Download /> SVG
            </Button>
            <Button size="sm" variant="ghost">
              <Power /> {active ? "Disable" : "Activate"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
