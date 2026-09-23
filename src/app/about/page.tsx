"use client";

import { Info, ShieldCheck, Zap, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/LanguageContext";

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Hero Section */}
      <div className="bg-white border-b border-black/5 py-16 mb-12">
        <div className="container mx-auto max-w-[1440px] px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-8">
            <Info className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('about.title')}</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('about.subtitle')}
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-[1440px] px-4 space-y-20">
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{t('about.smartSearch')}</h3>
            <p className="text-muted-foreground">
              {t('about.smartSearchDesc')}
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{t('about.actualPrices')}</h3>
            <p className="text-muted-foreground">
              {t('about.actualPricesDesc')}
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold mb-3">{t('about.verifiedClinics')}</h3>
            <p className="text-muted-foreground">
              {t('about.verifiedClinicsDesc')}
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-black/5 rounded-3xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('about.howItWorks')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('about.howItWorksSub')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary shadow-sm">1</div>
              <h4 className="font-bold text-lg mb-2">{t('about.step1Title')}</h4>
              <p className="text-sm text-muted-foreground">{t('about.step1Desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary shadow-sm">2</div>
              <h4 className="font-bold text-lg mb-2">{t('about.step2Title')}</h4>
              <p className="text-sm text-muted-foreground">{t('about.step2Desc')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary shadow-sm">3</div>
              <h4 className="font-bold text-lg mb-2">{t('about.step3Title')}</h4>
              <p className="text-sm text-muted-foreground">{t('about.step3Desc')}</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">{t('about.readyToFind')}</h2>
          <Link href="/">
            <Button size="lg" className="px-8 h-14 text-lg rounded-xl">
              {t('about.startSearch')}
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
