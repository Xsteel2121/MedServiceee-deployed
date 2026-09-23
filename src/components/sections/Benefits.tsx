"use client"

import { motion } from "framer-motion"
import { Zap, Tag, Map as MapIcon, ShieldCheck } from "lucide-react"
import { GlassCard } from "@/components/ui/GlassCard"
import { useTranslation } from "@/i18n/LanguageContext"

export function Benefits() {
  const { locale } = useTranslation();
  
  const getBenefits = () => {
    if (locale === 'en') {
      return [
        { title: "Smart Search", description: "Find the right services instantly with AI normalization.", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100" },
        { title: "Best Prices", description: "Compare costs across clinics and save money.", icon: Tag, color: "text-green-500", bg: "bg-green-100" },
        { title: "Clinic Map", description: "Convenient search for nearby medical centers.", icon: MapIcon, color: "text-blue-500", bg: "bg-blue-100" },
        { title: "Up-to-date Data", description: "Daily updates of price lists and ratings.", icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-100" },
      ];
    } else if (locale === 'kk') {
      return [
        { title: "Ақылды іздеу", description: "Қызметтерді AI көмегімен лезде табыңыз.", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100" },
        { title: "Ең жақсы бағалар", description: "Клиникалардағы бағаларды салыстырып, ақшаңызды үнемдеңіз.", icon: Tag, color: "text-green-500", bg: "bg-green-100" },
        { title: "Клиникалар картасы", description: "Жақын маңдағы медициналық орталықтарды ыңғайлы іздеу.", icon: MapIcon, color: "text-blue-500", bg: "bg-blue-100" },
        { title: "Өзекті деректер", description: "Бағалар мен рейтингтердің күнделікті жаңаруы.", icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-100" },
      ];
    } else {
      return [
        { title: "Умный поиск", description: "Мгновенно находите нужные услуги благодаря AI нормализации и умным алгоритмам.", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-100" },
        { title: "Самые выгодные цены", description: "Сравнивайте стоимость в разных клиниках и экономьте на медицинских услугах.", icon: Tag, color: "text-green-500", bg: "bg-green-100" },
        { title: "Карта клиник", description: "Удобный поиск ближайших медицинских центров с расчетом времени в пути.", icon: MapIcon, color: "text-blue-500", bg: "bg-blue-100" },
        { title: "Актуальные данные", description: "Ежедневное обновление прайс-листов и рейтингов напрямую из клиник.", icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-100" },
      ];
    }
  };

  const currentBenefits = getBenefits();

  return (
    <section className="py-20 relative z-10">
      <div className="container mx-auto max-w-[1440px] px-4">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            {locale === 'en' ? 'About MedServicePrice' : (locale === 'kk' ? 'MedServicePrice туралы' : 'О сервисе MedServicePrice')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {locale === 'en' ? 'We are creating a unified ecosystem of medical services in Kazakhstan.' : (locale === 'kk' ? 'Біз Қазақстандағы медициналық қызметтердің бірыңғай экожүйесін құрып жатырмыз.' : 'Мы создаем единую экосистему медицинских услуг Казахстана. Наша миссия — сделать медицину прозрачной, доступной и понятной для каждого пациента.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentBenefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GlassCard className="h-full flex flex-col items-start hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-2xl ${benefit.bg} flex items-center justify-center mb-6`}>
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  )
}
