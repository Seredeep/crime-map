// #region Imports
import { Analytics } from "@vercel/analytics/react";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { ImageModalProvider } from "../../lib/contexts";
import AppWrapper from "../components/AppWrapper";
import CapacitorProvider from "../components/CapacitorProvider";
import GlobalPanicButton from "../components/GlobalPanicButton";
import ImageModal from "../components/ImageModal";
import SessionProvider from "../components/SessionProvider";
import SessionRefresh from "../components/SessionRefresh";
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

// #region Dynamic Metadata Generation
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Metadata' });

  return {
    title: t('title'),
    description: t('description'),
    manifest: "/manifest.json",
    keywords: t('keywords').split(', '),
  };
}
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

// #region Static Params Generation
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
// #endregion

// #region Root Layout Component
export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Provide messages to client components
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full">
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
        {/* i18n Provider */}
        <NextIntlClientProvider messages={messages}>
          {/* Capacitor Provider - Inicializa plugins nativos */}
          <CapacitorProvider>
          {/* Session Management */}
          <SessionProvider>
            <SessionRefresh />

            {/* #region Image Modal Context */}
            <ImageModalProvider>
              {/* App Wrapper with Loading Screen */}
              <AppWrapper
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
          </CapacitorProvider>
        </NextIntlClientProvider>

        {/* Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
// #endregion
