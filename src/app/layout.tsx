import type { Metadata, Viewport } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { t } from "@/lib/i18n/es";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz"],
});
const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: { default: `${t.app.name} — ${t.app.tagline}`, template: `%s · ${t.app.name}` },
  description:
    "Devocionales diarios, planes de estudio bíblico, eventos, donaciones y comunidad de Soy Templo Internacional.",
  manifest: "/manifest.json",
  openGraph: { siteName: t.app.name, locale: "es_SV", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#163832",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // safe areas en iOS / Capacitor
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${instrument.variable}`}>
      <body className="min-h-dvh">
        <DesktopNav />
        {/* pb-24 deja espacio para la barra inferior en móvil */}
        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 md:px-6 md:pb-12">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
