import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AIChatWidget } from "@/components/AIChatWidget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["cyrillic", "latin"],
});

export const metadata: Metadata = {
  title: "MedServicePrice.kz - Сравните цены на медицинские услуги",
  description: "Агрегатор цен на медицинские услуги Казахстана",
};

import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { CommandPalette } from "@/components/CommandPalette";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <AIChatWidget />
          <CommandPalette />
          <Footer />
          <BottomNav />
        </LanguageProvider>
      </body>
    </html>
  );
}
