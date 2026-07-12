import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { BrandIntroAnimation, PurpleGlowBackground } from "@/components/brand";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "AvaSmoke.Ai",
    template: "%s · AvaSmoke.Ai",
  },
  description:
    "Store-grounded product discovery for licensed smoke and vape retailers.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08060d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} dark`}
    >
      <body className="font-sans antialiased">
        <TooltipProvider>
          <BrandIntroAnimation />
          <PurpleGlowBackground />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
