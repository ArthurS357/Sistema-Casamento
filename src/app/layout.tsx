import "./globals.css";
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

const APP_NAME = "Casamento.app";
const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const APP_DESCRIPTION =
  "Plataforma completa para noivos: gestão financeira do casamento, lista de presentes via PIX e site dos noivos com RSVP.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Gestão de Casamento, Lista de Presentes PIX e Site dos Noivos`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "gestão de casamento",
    "lista de presentes PIX",
    "site dos noivos",
    "planejamento de casamento",
    "RSVP casamento",
    "orçamento de casamento",
  ],
  authors: [{ name: APP_NAME }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Gestão de Casamento, Lista de Presentes PIX e Site dos Noivos`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Gestão de Casamento e Lista de Presentes PIX`,
    description: APP_DESCRIPTION,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-slate-50 text-slate-900">
        <Providers>
          {children}
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
