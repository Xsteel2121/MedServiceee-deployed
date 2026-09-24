"use client";

import { useEffect, useState } from "react";
import { Tag, ArrowRight, Clock, MapPin, Building2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/LanguageContext";
import { API_URL } from "@/lib/api";

interface Promotion {
  code: string;
  title: string;
  description: string;
  clinic_name: string;
  city: string;
  expires_at: string | null;
  source_url: string;
}

const cardColors = [
  ["bg-blue-50 border-blue-200", "text-blue-700", "bg-blue-100 text-blue-800"],
  ["bg-green-50 border-green-200", "text-green-700", "bg-green-100 text-green-800"],
  ["bg-purple-50 border-purple-200", "text-purple-700", "bg-purple-100 text-purple-800"],
];

export default function PromotionsPage() {
  const { locale } = useTranslation();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/promocodes/public`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Не удалось загрузить акции");
        return response.json() as Promise<Promotion[]>;
      })
      .then(setPromotions)
      .catch(err => { if (err.name !== "AbortError") setError("Не удалось загрузить акции"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return (
    <div className="bg-background min-h-screen pb-24 relative">
      <div className="bg-white border-b border-black/5 py-12 mb-8">
        <div className="container mx-auto max-w-[1440px] px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Tag className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {locale === "en" ? "Promotions and Discounts" : locale === "kk" ? "Акциялар мен Жеңілдіктер" : "Акции и скидки клиник"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {locale === "en" ? "Verified offers from medical centers." : locale === "kk" ? "Медициналық орталықтардың расталған ұсыныстары." : "Подтверждённые предложения медицинских центров."}
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-[1440px] px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!loading && (error || promotions.length === 0) && (
            <div className="rounded-3xl p-6 border transition-all hover:shadow-md flex flex-col bg-blue-50 border-blue-200">
              <p className="text-foreground/80">
                {error || (locale === "en" ? "No verified active promotions yet." : locale === "kk" ? "Әзірге расталған белсенді акциялар жоқ." : "Пока нет подтверждённых действующих акций.")}
              </p>
            </div>
          )}
          {promotions.map((promo, index) => {
            const [color, textColor, tagColor] = cardColors[index % cardColors.length];
            return (
              <div key={promo.code} className={`rounded-3xl p-6 border transition-all hover:shadow-md flex flex-col ${color}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${tagColor}`}>
                    {locale === "en" ? "Discount" : locale === "kk" ? "Жеңілдік" : "Скидка"}
                  </span>
                  <div className="flex items-center text-sm font-medium opacity-70">
                    <Clock className="w-4 h-4 mr-1" />
                    {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString(locale === "kk" ? "kk-KZ" : "ru-RU") : (locale === "kk" ? "Мерзімі көрсетілмеген" : "Срок не указан")}
                  </div>
                </div>
                <h3 className={`text-2xl font-bold mb-3 leading-tight ${textColor}`}>{promo.title}</h3>
                <p className="text-foreground/80 mb-6 flex-1">{promo.description}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm font-medium"><Building2 className="w-4 h-4 mr-2 opacity-60" />{promo.clinic_name}</div>
                  <div className="flex items-center text-sm font-medium"><MapPin className="w-4 h-4 mr-2 opacity-60" />{promo.city}</div>
                </div>
                <Button variant="default" className="w-full justify-between group bg-white hover:bg-white/90 text-foreground border shadow-sm" onClick={() => setSelectedPromo(promo)}>
                  {locale === "en" ? "Get Coupon" : locale === "kk" ? "Купон алу" : "Получить купон"}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setSelectedPromo(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-black"><X className="w-6 h-6" /></button>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-8 h-8 text-green-600" /></div>
            <h2 className="text-2xl font-bold text-center mb-2">{locale === "kk" ? "Промокод" : "Промокод"}</h2>
            <p className="text-center text-muted-foreground mb-6">
              {locale === "kk" ? "Кодты MedServicePrice сайтында жазылу кезінде енгізіңіз. Шарттарды клиника сайтынан тексеріңіз." : "Введите код при записи через MedServicePrice. Условия акции проверьте на сайте клиники."}
            </p>
            <div className="bg-black/5 rounded-2xl p-6 text-center mb-6 border border-black/10 border-dashed">
              <div className="text-4xl font-mono font-bold tracking-widest text-primary">{selectedPromo.code}</div>
            </div>
            <a href={selectedPromo.source_url} target="_blank" rel="noopener noreferrer" className="block text-center text-primary mb-6">
              {locale === "kk" ? "Клиника сайтындағы шарттар" : "Условия на сайте клиники"}
            </a>
            <Button className="w-full h-14 text-lg" onClick={() => setSelectedPromo(null)}>{locale === "kk" ? "Түсінікті" : "Понятно"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
