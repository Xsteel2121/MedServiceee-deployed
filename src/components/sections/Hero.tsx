"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin, Search, Activity } from "lucide-react"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { useTranslation } from "@/i18n/LanguageContext"

export function Hero() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("")
  const [city, setCity] = useState("Алматы")
  const router = useRouter()

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&city=${encodeURIComponent(city)}`)
    }
  }

  return (
    <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-40">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="container mx-auto max-w-[1440px] px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          
          {/* Left Content */}
          <div className="flex-1 w-full max-w-2xl z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-2xl pt-10 pb-8">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 leading-[1.1] mb-6">
                  {t('hero.titlePart1')} <br className="hidden sm:block" />
                  <span className="text-primary">{t('hero.titleHighlight')}</span> <br className="hidden sm:block" />
                  {t('hero.titlePart2')}
                </h1>
                
                <p className="text-lg text-zinc-600 mb-10 max-w-xl leading-relaxed">
                  {t('hero.description')}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative z-20 mb-12"
            >
              <div className="bg-white p-2 rounded-2xl shadow-xl border border-zinc-200 flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 border-b md:border-b-0 md:border-r border-zinc-200 py-1 md:py-0">
                  <Search className="w-5 h-5 text-primary shrink-0" />
                  <input 
                    type="text" 
                    placeholder={t('hero.searchPlaceholder')}
                    className="w-full h-14 bg-transparent border-none outline-none text-sm placeholder:text-zinc-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-3 px-4 w-full md:w-auto md:min-w-[200px] py-1 md:py-0">
                  <MapPin className="w-5 h-5 text-zinc-400 shrink-0" />
                  <select 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-14 bg-transparent border-none outline-none text-sm font-medium cursor-pointer"
                  >
                    <option value="Алматы">Алматы</option>
                    <option value="Астана">Астана</option>
                    <option value="Шымкент">Шымкент</option>
                    <option value="Караганда">Караганда</option>
                    <option value="Актобе">Актобе</option>
                    <option value="Павлодар">Павлодар</option>
                  </select>
                </div>

                <Button onClick={handleSearch} className="h-14 px-8 rounded-xl font-medium shadow-glow">
                  {t('hero.searchButton')}
                </Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="pt-8"
            >
              <p className="text-sm font-medium text-zinc-500 mb-4">{t('hero.popular')}</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/search?q=Анализы" className="px-4 py-2 bg-white rounded-xl border border-zinc-200 text-sm font-medium hover:border-primary hover:text-primary transition-all shadow-sm">{t('categories.tests')}</Link>
                <Link href="/search?q=Врач" className="px-4 py-2 bg-white rounded-xl border border-zinc-200 text-sm font-medium hover:border-primary hover:text-primary transition-all shadow-sm">{t('categories.doctor')}</Link>
                <Link href="/search?q=Диагностика" className="px-4 py-2 bg-white rounded-xl border border-zinc-200 text-sm font-medium hover:border-primary hover:text-primary transition-all shadow-sm">{t('categories.diagnostics')}</Link>
                <Link href="/search?q=УЗИ" className="px-4 py-2 bg-white rounded-xl border border-zinc-200 text-sm font-medium hover:border-primary hover:text-primary transition-all shadow-sm">{t('categories.ultrasound')}</Link>
              </div>
            </motion.div>
          </div>

          {/* Right Content - 3D Illustration Mockup */}
          <motion.div 
            className="flex-1 w-full relative hidden lg:flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="relative w-[500px] h-[500px]">
              {/* Abstract Representation of Map and Clinics */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-white rounded-[3rem] shadow-2xl border border-white/60 overflow-hidden">
                <div className="absolute w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                
                {/* Floating Elements representing UI */}
                <motion.div 
                  animate={{ y: [-10, 10, -10] }} 
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute top-[15%] right-[10%] w-48 h-24 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-4 flex flex-col gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-primary" />
                  </div>
                  <div className="w-3/4 h-2 bg-gray-200 rounded-full" />
                  <div className="w-1/2 h-2 bg-gray-100 rounded-full" />
                </motion.div>

                <motion.div 
                  animate={{ y: [10, -10, 10] }} 
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-[20%] left-[5%] w-56 h-32 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                       <MapPin className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">-1500 ₸</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full mb-2" />
                  <div className="w-2/3 h-2 bg-gray-100 rounded-full" />
                </motion.div>

                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }} 
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="absolute top-[40%] left-[30%] w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full opacity-80 blur-2xl -z-10"
                />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
