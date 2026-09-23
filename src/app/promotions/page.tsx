"use client";

import { useState } from "react";
import { Tag, ArrowRight, Clock, MapPin, Building2, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/LanguageContext";

const PROMOTIONS = [
  {
    id: 1,
    title: "Скидка 20% на все виды МРТ",
    clinic: "КДЛ Олимп",
    city: "Алматы, Астана",
    validUntil: "До 31 августа",
    description: "Пройдите обследование на современном оборудовании со скидкой 20%. Акция действует во всех филиалах.",
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    tagColor: "bg-blue-100 text-blue-800"
  },
  {
    id: 2,
    title: "Комплексный Check-up организма",
    clinic: "Сункар",
    city: "Алматы",
    validUntil: "До 15 сентября",
    description: "Полное обследование организма (ОАК, биохимия, УЗИ, ЭКГ + прием терапевта) за 45 000 ₸ вместо 65 000 ₸.",
    color: "bg-green-50 border-green-200",
    textColor: "text-green-700",
    tagColor: "bg-green-100 text-green-800"
  },
  {
    id: 3,
    title: "Бесплатная консультация гинеколога",
    clinic: "Эмирмед",
    city: "Алматы, Шымкент",
    validUntil: "Постоянная акция",
    description: "При сдаче анализов на сумму от 15 000 ₸ консультация гинеколога предоставляется бесплатно.",
    color: "bg-purple-50 border-purple-200",
    textColor: "text-purple-700",
    tagColor: "bg-purple-100 text-purple-800"
  },
  {
    id: 4,
    title: "-15% на детские анализы",
    clinic: "Invivo",
    city: "Все города",
    validUntil: "По выходным",
    description: "Каждые выходные действует скидка 15% на все виды лабораторных исследований для детей до 12 лет.",
    color: "bg-orange-50 border-orange-200",
    textColor: "text-orange-700",
    tagColor: "bg-orange-100 text-orange-800"
  },
  {
    id: 5,
    title: "УЗИ брюшной полости в подарок",
    clinic: "Достар Мед",
    city: "Алматы",
    validUntil: "До 30 сентября",
    description: "При прохождении ФГДС получите УЗИ брюшной полости совершенно бесплатно.",
    color: "bg-rose-50 border-rose-200",
    textColor: "text-rose-700",
    tagColor: "bg-rose-100 text-rose-800"
  },
  {
    id: 6,
    title: "Осеннее обострение: скидки на гастроэнтеролога",
    clinic: "Керуен Medicus",
    city: "Алматы",
    validUntil: "До 31 октября",
    description: "Первичный прием врача-гастроэнтеролога со скидкой 30%. Подготовьтесь к осеннему сезону.",
    color: "bg-teal-50 border-teal-200",
    textColor: "text-teal-700",
    tagColor: "bg-teal-100 text-teal-800"
  }
];

export default function PromotionsPage() {
  const { locale } = useTranslation();
  const [selectedPromo, setSelectedPromo] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState<string>("");

  const getPromotions = () => {
    if (locale === 'en') {
      return [
        { id: 1, title: "20% off all MRI scans", clinic: "KDL Olimp", city: "Almaty, Astana", validUntil: "Until Aug 31", description: "Get examined on modern equipment with a 20% discount. Valid in all branches.", color: "bg-blue-50 border-blue-200", textColor: "text-blue-700", tagColor: "bg-blue-100 text-blue-800" },
        { id: 2, title: "Comprehensive Check-up", clinic: "Sunkar", city: "Almaty", validUntil: "Until Sep 15", description: "Full body examination for 45,000 ₸ instead of 65,000 ₸.", color: "bg-green-50 border-green-200", textColor: "text-green-700", tagColor: "bg-green-100 text-green-800" },
        { id: 3, title: "Free gynecologist consultation", clinic: "Emirmed", city: "Almaty, Shymkent", validUntil: "Permanent offer", description: "Free consultation when taking tests worth over 15,000 ₸.", color: "bg-purple-50 border-purple-200", textColor: "text-purple-700", tagColor: "bg-purple-100 text-purple-800" }
      ];
    } else if (locale === 'kk') {
      return [
        { id: 1, title: "Барлық МРТ түрлеріне 20% жеңілдік", clinic: "КДЛ Олимп", city: "Алматы, Астана", validUntil: "31 тамызға дейін", description: "Заманауи құралдармен 20% жеңілдікпен тексеріліңіз.", color: "bg-blue-50 border-blue-200", textColor: "text-blue-700", tagColor: "bg-blue-100 text-blue-800" },
        { id: 2, title: "Кешенді Check-up", clinic: "Сұңқар", city: "Алматы", validUntil: "15 қыркүйекке дейін", description: "Ағзаны толық тексеру 65 000 ₸ орнына 45 000 ₸.", color: "bg-green-50 border-green-200", textColor: "text-green-700", tagColor: "bg-green-100 text-green-800" },
        { id: 3, title: "Гинекологтың тегін консультациясы", clinic: "Эмирмед", city: "Алматы, Шымкент", validUntil: "Тұрақты акция", description: "15 000 ₸ басталатын анализдерді тапсырғанда тегін.", color: "bg-purple-50 border-purple-200", textColor: "text-purple-700", tagColor: "bg-purple-100 text-purple-800" }
      ];
    } else {
      return PROMOTIONS;
    }
  };

  const currentPromotions = getPromotions();

  const handleGetCoupon = (id: number) => {
    setSelectedPromo(id);
    // These codes are also seeded in backend/seed_features.py and can be used
    // in the booking modal for an actual discount.
    setCouponCode(id === 1 ? "WELCOME10" : "MEDKZ500");
  };

  const closeModal = () => {
    setSelectedPromo(null);
  };

  return (
    <div className="bg-background min-h-screen pb-24 relative">
      {/* Header */}
      <div className="bg-white border-b border-black/5 py-12 mb-8">
        <div className="container mx-auto max-w-[1440px] px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Tag className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {locale === 'en' ? 'Promotions and Discounts' : (locale === 'kk' ? 'Акциялар мен Жеңілдіктер' : 'Акции и скидки клиник')}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {locale === 'en' ? 'The best offers from medical centers. Save on health without losing quality!' : (locale === 'kk' ? 'Медициналық орталықтардың ең тиімді ұсыныстары. Сапаны жоғалтпай денсаулығыңызды үнемдеңіз!' : 'Самые выгодные предложения от медицинских центров. Экономьте на здоровье без потери качества!')}
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-[1440px] px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPromotions.map((promo) => (
            <div key={promo.id} className={`rounded-3xl p-6 border transition-all hover:shadow-md flex flex-col ${promo.color}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${promo.tagColor}`}>
                  {locale === 'en' ? 'Discount' : (locale === 'kk' ? 'Жеңілдік' : 'Скидка')}
                </span>
                <div className="flex items-center text-sm font-medium opacity-70">
                  <Clock className="w-4 h-4 mr-1" />
                  {promo.validUntil}
                </div>
              </div>
              
              <h3 className={`text-2xl font-bold mb-3 leading-tight ${promo.textColor}`}>
                {promo.title}
              </h3>
              
              <p className="text-foreground/80 mb-6 flex-1">
                {promo.description}
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm font-medium">
                  <Building2 className="w-4 h-4 mr-2 opacity-60" />
                  {promo.clinic}
                </div>
                <div className="flex items-center text-sm font-medium">
                  <MapPin className="w-4 h-4 mr-2 opacity-60" />
                  {promo.city}
                </div>
              </div>
              
              <Button 
                variant="default" 
                className="w-full justify-between group bg-white hover:bg-white/90 text-foreground border shadow-sm"
                onClick={() => handleGetCoupon(promo.id)}
              >
                {locale === 'en' ? 'Get Coupon' : (locale === 'kk' ? 'Купон алу' : 'Получить купон')}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Coupon Modal */}
      {selectedPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-muted-foreground hover:text-black">
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">
              {locale === 'en' ? 'Your promo code is ready!' : (locale === 'kk' ? 'Промокодыңыз дайын!' : 'Ваш промокод готов!')}
            </h2>
            <p className="text-center text-muted-foreground mb-6">
              {locale === 'en' 
                ? 'Show this code to the administrator at the clinic to get a discount.' 
                : (locale === 'kk' 
                  ? 'Жеңілдік алу үшін осы кодты клиникадағы әкімшіге көрсетіңіз.' 
                  : 'Покажите этот код администратору в клинике для получения скидки по акции.')}
            </p>
            
            <div className="bg-black/5 rounded-2xl p-6 text-center mb-6 border border-black/10 border-dashed">
              <div className="text-4xl font-mono font-bold tracking-widest text-primary">
                {couponCode}
              </div>
            </div>
            
            <Button className="w-full h-14 text-lg" onClick={closeModal}>
              {locale === 'en' ? 'Great, thanks!' : (locale === 'kk' ? 'Тамаша, рақмет!' : 'Отлично, спасибо!')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
