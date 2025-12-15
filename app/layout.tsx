import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/error-boundary";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { LanguageProvider } from "@/contexts/language-context";

export const metadata: Metadata = {
  title: "Revela - App de Fotos Antes e Depois para Profissionais | Comparação Profissional",
  description: "Plataforma profissional para comparar fotos antes e depois. Ideal para médicos, dentistas, esteticistas e profissionais de saúde. Privacidade total, armazenamento local.",
  keywords: ["fotos antes depois", "comparador fotos", "app antes depois", "ferramenta comparação fotos", "visualizador antes depois", "app fotos médicos", "software antes depois profissional"],
  applicationName: "Revela",
  manifest: "/manifest.json",
  themeColor: "#1A2B32",
  authors: [{ name: "Revela" }],
  creator: "Revela",
  publisher: "Revela",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://revela.app",
    siteName: "Revela",
    title: "Revela - App de Fotos Antes e Depois para Profissionais",
    description: "Compare fotos antes e depois com privacidade total. Ferramenta profissional para médicos, dentistas e esteticistas.",
    images: [
      {
        url: "https://revela.app/revela3.png",
        width: 1200,
        height: 630,
        alt: "Revela - Comparação de Fotos Antes e Depois",
        type: "image/png",
        secureUrl: "https://revela.app/revela3.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Revela - App de Fotos Antes e Depois",
    description: "Compare fotos antes e depois com privacidade total. Ferramenta profissional para profissionais de saúde e estética.",
    images: ["/revela3.png"],
  },
  alternates: {
    canonical: "https://revela.app",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Preconnect para melhorar performance de conexões externas */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Revela" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Revela" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1A2B32" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <ServiceWorkerRegistration />
          <PWAInstallPrompt />
        </LanguageProvider>
      </body>
    </html>
  );
}
