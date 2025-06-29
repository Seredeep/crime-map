import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ImageModalProvider } from "../lib/ImageModalContext";
import GlobalPanicButton from "./components/GlobalPanicButton";
import ImageModal from "./components/ImageModal";
import Navbar from "./components/Navbar";
import SessionProvider from "./components/SessionProvider";
import SessionRefresh from "./components/SessionRefresh";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crime Map - Report and Track Incidents",
  description: "Interactive crime map application to report and track local incidents",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-full`}
        suppressHydrationWarning
      >
        <SessionProvider>
          <SessionRefresh />
          <Navbar />
          <ImageModalProvider>
            {children}
            <ImageModal />
            <GlobalPanicButton />
          </ImageModalProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
