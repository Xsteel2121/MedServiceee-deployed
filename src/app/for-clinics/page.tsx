"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChartBar, Users, ArrowRight, ShieldCheck, Zap, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslation } from "@/i18n/LanguageContext";

export default function ForClinicsPage() {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <section className="bg-white border-b border-black/5 pt-20 pb-24">
        <div className="container mx-auto max-w-[1440px] px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight text-foreground">
              {t('forClinics.titlePart1')} <span className="text-primary">MedServicePrice</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10">
              {t('forClinics.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto" onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('forClinics.requestBtn')}
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg w-full sm:w-auto" onClick={() => setIsRatesModalOpen(true)}>
                {t('forClinics.ratesBtn')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto max-w-[1440px] px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t('forClinics.whyUs')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('forClinics.whyUsSub')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t('forClinics.newPatients')}</h3>
              <p className="text-muted-foreground">
                {t('forClinics.newPatientsDesc')}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                <ChartBar className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t('forClinics.analytics')}</h3>
              <p className="text-muted-foreground">
                {t('forClinics.analyticsDesc')}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t('forClinics.trust')}</h3>
              <p className="text-muted-foreground">
                {t('forClinics.trustDesc')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="request-form" className="py-20 bg-white border-y border-black/5">
        <div className="container mx-auto max-w-[1440px] px-4">
          <div className="max-w-4xl mx-auto bg-primary/5 rounded-[3rem] p-8 md:p-12 lg:p-16 flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-4">{t('forClinics.formTitle')}</h2>
              <p className="text-muted-foreground mb-8">
                {t('forClinics.formSub')}
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-center gap-3 font-medium">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Zap className="w-3 h-3" /></div>
                  {t('forClinics.formPoint1')}
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Zap className="w-3 h-3" /></div>
                  {t('forClinics.formPoint2')}
                </li>
                <li className="flex items-center gap-3 font-medium">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Zap className="w-3 h-3" /></div>
                  {t('forClinics.formPoint3')}
                </li>
              </ul>
            </div>
            
            <div className="w-full md:w-[400px] bg-white p-8 rounded-3xl shadow-xl">
              {isSubmitted ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Заявка отправлена!</h3>
                  <p className="text-muted-foreground mb-6">
                    Спасибо за интерес к платформе. Наш менеджер скоро свяжется с вами!
                  </p>
                  <Button className="w-full" onClick={() => setIsSubmitted(false)}>Отправить еще</Button>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-bold mb-6">Заявка на подключение</h3>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Название клиники</label>
                      <Input placeholder="Например: Medical Center Sunkar" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Город</label>
                      <Input placeholder="Алматы" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Имя контактного лица</label>
                      <Input placeholder="Ваше имя" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Номер телефона</label>
                      <Input placeholder="+7 (777) 000-00-00" type="tel" />
                    </div>
                  </div>
                  <Button className="w-full h-12 group" onClick={() => setIsSubmitted(true)}>
                    Отправить заявку
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Rates Modal */}
      {isRatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsRatesModalOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-black">
              <X className="w-6 h-6" /> 
            </button>
            
            <h2 className="text-2xl font-bold mb-2 text-center">Тарифы для клиник</h2>
            <p className="text-muted-foreground mb-8 text-center">
              Выберите оптимальный план размещения вашей клиники на портале.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-border p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-2">Стандарт</h3>
                <div className="text-3xl font-extrabold mb-4">Бесплатно</div>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Размещение профиля клиники</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Базовый прайс-лист</li>
                  <li className="flex items-center gap-2 text-muted-foreground"><X className="w-4 h-4 shrink-0" /> Без приоритета в поиске</li>
                  <li className="flex items-center gap-2 text-muted-foreground"><X className="w-4 h-4 shrink-0" /> Без публикации акций</li>
                </ul>
                <Button variant="outline" className="w-full" onClick={() => {setIsRatesModalOpen(false); document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}}>Выбрать</Button>
              </div>

              <div className="border-2 border-primary p-6 rounded-2xl bg-primary/5 relative">
                <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">ХИТ</div>
                <h3 className="text-xl font-bold mb-2">Премиум</h3>
                <div className="text-3xl font-extrabold mb-4">49 000 ₸<span className="text-sm font-normal text-muted-foreground">/мес</span></div>
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Всё из Стандарта</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Приоритет в поисковой выдаче</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Публикация до 5 акций</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Аналитика переходов</li>
                </ul>
                <Button className="w-full" onClick={() => {setIsRatesModalOpen(false); document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}}>Подключить</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
