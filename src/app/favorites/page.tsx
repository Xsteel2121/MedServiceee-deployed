"use client";

import { useState } from "react";
import { Heart, Search, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ClinicCard } from "@/components/ClinicCard";
import { useTranslation } from "@/i18n/LanguageContext";
import type { SearchResult } from "@/lib/types";

function readFavorites(): SearchResult[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem("favorites");
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved) as Record<string, SearchResult>;
    return Object.values(parsed);
  } catch {
    return [];
  }
}

export default function FavoritesPage() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<SearchResult[]>(readFavorites);

  const removeFavorite = (id: string) => {
    const saved = localStorage.getItem("favorites");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        delete parsed[id];
        localStorage.setItem("favorites", JSON.stringify(parsed));
        setFavorites(Object.values(parsed));
      } catch { }
    }
  }

  return (
    <div className="bg-background min-h-screen pb-24">
      <div className="bg-white border-b border-black/5 py-12 mb-8">
        <div className="container mx-auto max-w-[1440px] px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-50 mb-6">
            <Heart className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">{t('favorites.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('favorites.subtitle')}
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-[1440px] px-4">
        {favorites.length === 0 ? (
          <div className="max-w-md mx-auto text-center space-y-6 py-12">
            <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-2xl font-bold">{t('favorites.emptyTitle')}</h2>
            <p className="text-muted-foreground">
              {t('favorites.emptyDesc')}
            </p>
            
            <Link href="/search" className="inline-block mt-8">
              <Button size="lg" className="h-14 px-8 rounded-xl gap-2">
                <Search className="w-5 h-5" />
                {t('favorites.goToSearch')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {favorites.map((result, index) => (
              <motion.div
                key={result.service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 hover:border-primary/20 transition-all relative"
              >
                <div className="mb-6 border-b border-black/5 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md inline-block">
                          {result.service.category}
                        </span>
                        <button 
                          onClick={() => removeFavorite(result.service.id)} 
                          className="p-1.5 rounded-full transition-colors bg-rose-50 text-rose-500 hover:bg-black/5 hover:text-muted-foreground"
                          title="Удалить из избранного"
                        >
                          <Heart className="w-4 h-4 fill-rose-500 text-rose-500 hover:fill-transparent" />
                        </button>
                      </div>
                      <h2 className="text-2xl font-bold mt-1">{result.service.name_raw}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t('favorites.avgPrice')}</p>
                      <p className="font-medium text-lg">~{Math.round(result.avg_price).toLocaleString('ru-RU')} ₸</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> 
                    {t('favorites.bestOffer').replace('{count}', String(result.clinics_count))}
                  </h3>
                  
                  {result.best_offer_clinic && result.best_offer_price != null && (
                    <ClinicCard
                      clinicId={result.best_offer_clinic.id}
                      clinicName={result.best_offer_clinic.name}
                      address={result.best_offer_clinic.address}
                      price={result.best_offer_price}
                      sourceUrl={result.best_offer_clinic.source_url ?? ""}
                    />
                  )}
                  
                  <div className="pt-4 mt-4 border-t border-black/5 flex justify-end">
                    <Link href={`/compare/${result.service.id}?city=Алматы`}>
                      <Button variant="outline" className="gap-2">
                        {t('favorites.compareAll').replace('{count}', String(result.clinics_count))}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
