// #region Imports
import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ImageModalProvider } from "../lib/contexts";
import AppWrapper from "./components/AppWrapper";
import GlobalPanicButton from "./components/GlobalPanicButton";
import ImageModal from "./components/ImageModal";
import Navbar from "./components/Navbar";
import SessionProvider from "./components/SessionProvider";
import SessionRefresh from "./components/SessionRefresh";
import "./globals.css";
// #endregion

// #region Font Configuration
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
// #endregion

// #region Metadata Configuration
export const metadata: Metadata = {
  title: "Claridad - Comunidad de seguridad",
  description:
    "Claridad es una aplicación de seguridad vecinal que te permite reportar delitos, activar alertas comunitarias en tiempo real y consultar un mapa de incidentes en tu zona. Pensado para fortalecer la red entre vecinos.",
  manifest: "/manifest.json",

  // #region SEO Keywords
  keywords: [
    "seguridad vecinal",
    "mapa de crimen",
    "alertas de seguridad",
    "botón de pánico",
    "app de seguridad",
    "reportes vecinales",
    "claridad",
    "incidentes en tiempo real",
    "comunidad segura",
    "crime map argentina",
    "seguridad vecinal",
  ],
  // #endregion

  // #region Authors information
  authors: [
    { name: "Claridad Team", url: "https://claridad.app" },
    { name: "Matías Lautaro Wainsten Juárez" },
    { name: "Iñaki Etchegaray" },
    { name: "Valentín Sánchez Guevara" },
  ],
  creator: "Claridad Team",
  // #endregion

  // #region Open Graph metadata for social media sharing
  openGraph: {
    title: "Claridad - Seguridad vecinal en tiempo real",
    description:
      "Unite a la red de vecinos que reportan y reciben alertas de seguridad en tiempo real. Mapa de crimen, botón de pánico y comunidad conectada.",
    url: "https://claridad.app",
    siteName: "Claridad",
    images: [
      {
        url: "https://claridad.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Claridad - Seguridad vecinal",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  // #endregion

  // #region Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Claridad - Seguridad vecinal en tiempo real",
    description:
      "Reporta delitos, activa alertas y mantenete informado sobre lo que pasa en tu barrio. Conectate con tu comunidad con Claridad.",
    images: ["https://claridad.app/og-image.png"],
  },
  // #endregion

  // #region PWA configuration for Apple devices
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Claridad",
  },
  // #endregion

  // #region App icons
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  // #endregion
};
// #endregion

// #region Viewport Configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Para que en iOS full screen PWA no quede mal
  themeColor: "#111827",
};
// #endregion

// #region Root Layout Component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      {/* PWA Meta Tags */}
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>

      {/* Main Body */}
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-full`}
        suppressHydrationWarning
      >
        {/* Session Management */}
        <SessionProvider>
          <SessionRefresh />

          {/* #region Image Modal Context */}
          <ImageModalProvider>
            {/* App Wrapper with Loading Screen */}
            <AppWrapper
              navbar={<Navbar />}
              globalComponents={
                <>
                  <ImageModal />
                  <GlobalPanicButton />
                </>
              }
            >
              {children}
            </AppWrapper>
          </ImageModalProvider>
          {/* #endregion */}
        </SessionProvider>

        {/* Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
// #endregion
