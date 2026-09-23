"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Search, SlidersHorizontal, MapPin, Star, Loader2, ArrowRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ClinicCard } from "@/components/ClinicCard"
import { useTranslation } from "@/i18n/LanguageContext"
import { API_URL } from "@/lib/api"

interface Clinic {
  id: string
  name: string
  city: string
  address: string
  source_url?: string | null
  rating?: number
  has_online_booking?: boolean
  has_active_promotion?: boolean
}

interface Service {
  id: string
  name_raw: string
  category: string
}

interface SearchResult {
  service: Service
  avg_price: number
  min_price: number
  clinics_count: number
  best_offer_clinic: Clinic
  best_offer_price: number
  last_updated_at?: string
}

function SearchPageContent() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""
  const initialCity = searchParams.get("city") || "Алматы"

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [city, setCity] = useState(initialCity)
  const [results, setResults] = useState<SearchResult[]>([])
  const [favorites, setFavorites] = useState<Record<string, SearchResult>>(() => {
    if (typeof window === "undefined") return {}
    const saved = localStorage.getItem("favorites")
    if (!saved) return {}
    try {
      return JSON.parse(saved) as Record<string, SearchResult>
    } catch {
      return {}
    }
  })

  const toggleFavorite = (result: SearchResult) => {
    const id = result.service.id
    setFavorites(prev => {
      const newFavs = { ...prev }
      if (newFavs[id]) {
        delete newFavs[id]
      } else {
        newFavs[id] = result
      }
      localStorage.setItem("favorites", JSON.stringify(newFavs))
      return newFavs
    })
  }

  // Price filter states
  const [minPriceInput, setMinPriceInput] = useState("")
  const [maxPriceInput, setMaxPriceInput] = useState("")
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)

  const [minRating, setMinRating] = useState<number | null>(null)
  const [onlineBooking, setOnlineBooking] = useState<boolean | null>(null)
  const [specialty, setSpecialty] = useState("")
  const [language, setLanguage] = useState("")
  const [hasPromotion, setHasPromotion] = useState<boolean | null>(null)
  const [sortBy, setSortBy] = useState<string>("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(initialQuery)
      setCity(initialCity)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialQuery, initialCity])

  const fetchResults = async (q: string, c: string, minR: number|null, onB: boolean|null, sBy: string, minP: number|null, maxP: number|null, selectedSpecialty: string, selectedLanguage: string, selectedPromotion: boolean|null) => {
    if (!q || q.length < 2) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      let url = `${API_URL}/api/search?q=${encodeURIComponent(q)}&city=${encodeURIComponent(c)}`
      if (minR !== null) url += `&min_rating=${minR}`
      if (onB !== null) url += `&online_booking=${onB}`
      if (sBy) url += `&sort_by=${sBy}`
      if (minP !== null) url += `&min_price=${minP}`
      if (maxP !== null) url += `&max_price=${maxP}`
      if (selectedSpecialty) url += `&specialty=${encodeURIComponent(selectedSpecialty)}`
      if (selectedLanguage) url += `&language=${encodeURIComponent(selectedLanguage)}`
      if (selectedPromotion !== null) url += `&has_promotion=${selectedPromotion}`
      
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error("Ошибка при поиске")
      }
      const data = await res.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchResults(searchQuery, city, minRating, onlineBooking, sortBy, minPrice, maxPrice, specialty, language, hasPromotion)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [searchQuery, city, minRating, onlineBooking, sortBy, minPrice, maxPrice, specialty, language, hasPromotion])

  useEffect(() => {
    if (initialQuery.length < 2) return
    const timer = window.setTimeout(() => {
      void fetchResults(initialQuery, initialCity, null, null, "", null, null, "", "", null)
    }, 1)
    return () => window.clearTimeout(timer)
  }, [initialQuery, initialCity])

  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&city=${encodeURIComponent(city)}`)
    }
  }

  const applyPriceFilter = () => {
    setMinPrice(minPriceInput ? parseInt(minPriceInput) : null)
    setMaxPrice(maxPriceInput ? parseInt(maxPriceInput) : null)
  }

  const filteredResults = results;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="bg-background min-h-screen pt-4 pb-24">
      <div className="container mx-auto max-w-[1440px] px-4">

        {/* Mobile Search & Filter Toggle */}
        <div className="lg:hidden flex gap-2 mb-6">
          <Input
            placeholder={t('search.searchPlaceholder')}
            icon={<Search className="w-5 h-5" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-12 flex-1 bg-white"
          />
          <Button variant="outline" size="icon" className="h-12 w-12 shrink-0 bg-white" onClick={() => handleSearch()}>
            <Search className="w-5 h-5" />
          </Button>
        </div>

        {/* Mobile Categories Scroll */}
        <div className="lg:hidden overflow-x-auto pb-4 mb-2 -mx-4 px-4 flex gap-2 scrollbar-hide">
          {[
            { label: t('categories.tests'), value: "Анализы" },
            { label: t('categories.doctor'), value: "Прием врача" },
            { label: t('categories.ultrasound'), value: "УЗИ" },
            { label: "МРТ", value: "МРТ" },
            { label: t('search.xRay'), value: "Рентген" },
            { label: t('search.cbc'), value: "ОАК" }
          ].map(cat => (
            <button
              key={cat.value}
              onClick={() => { setSearchQuery(cat.value); router.push(`/search?q=${encodeURIComponent(cat.value)}&city=${encodeURIComponent(city)}`); }}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium border transition-colors ${searchQuery.toLowerCase().includes(cat.value.toLowerCase()) ? 'bg-primary text-white border-primary' : 'bg-white text-zinc-600 border-black/10 hover:border-primary/50'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-28 space-y-6 bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">{t('search.filters')}</h2>
              </div>

              {/* City Filter */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{t('search.city')}</h3>
                <div className="relative flex items-center bg-black/5 rounded-xl h-12 hover:bg-black/10 transition-colors">
                  <MapPin className="w-4 h-4 text-primary absolute left-3 pointer-events-none" />
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&city=${encodeURIComponent(e.target.value)}`);
                    }}
                    className="w-full h-full bg-transparent pl-9 pr-8 appearance-none border-none outline-none text-sm font-medium cursor-pointer"
                  >
                    <option value="Алматы">Алматы</option>
                    <option value="Астана">Астана</option>
                    <option value="Шымкент">Шымкент</option>
                    <option value="Караганда">Караганда</option>
                    <option value="Актобе">Актобе</option>
                    <option value="Павлодар">Павлодар</option>
                  </select>
                  <svg className="w-4 h-4 text-muted-foreground absolute right-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{t('search.category')}</h3>
                <div className="space-y-2">
                  {[
                    { label: t('categories.tests'), value: "Анализы" },
                    { label: t('categories.doctor'), value: "Прием врача" },
                    { label: t('categories.ultrasound'), value: "УЗИ" },
                    { label: "МРТ", value: "МРТ" },
                    { label: t('search.xRay'), value: "Рентген" },
                    { label: t('search.cbc'), value: "ОАК" }
                  ].map((cat) => (
                    <label key={cat.value} className="flex items-center gap-3 cursor-pointer group" onClick={() => { setSearchQuery(cat.value); router.push(`/search?q=${encodeURIComponent(cat.value)}&city=${encodeURIComponent(city)}`); }}>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${searchQuery.toLowerCase().includes(cat.value.toLowerCase()) ? 'border-primary bg-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                        {searchQuery.toLowerCase().includes(cat.value.toLowerCase()) && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="text-sm">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{t('search.price')}</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={t('search.priceFrom')}
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    className="w-full bg-black/5 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="number"
                    placeholder={t('search.priceTo')}
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    className="w-full bg-black/5 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{locale === 'en' ? 'Rating' : (locale === 'kk' ? 'Рейтинг' : 'Рейтинг')}</h3>
                <div className="relative flex items-center bg-black/5 rounded-xl h-12 hover:bg-black/10 transition-colors">
                  <Star className="w-4 h-4 text-primary absolute left-3 pointer-events-none" />
                  <select
                    value={minRating || ""}
                    onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full h-full bg-transparent pl-9 pr-8 appearance-none border-none outline-none text-sm font-medium cursor-pointer"
                  >
                    <option value="">{locale === 'en' ? 'Any' : (locale === 'kk' ? 'Кез келген' : 'Любой')}</option>
                    <option value="4.0">4.0+</option>
                    <option value="4.5">4.5+</option>
                  </select>
                  <svg className="w-4 h-4 text-muted-foreground absolute right-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              {/* Online Booking Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${onlineBooking === true ? 'border-primary bg-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                    <input type="checkbox" className="hidden" checked={onlineBooking === true} onChange={(e) => setOnlineBooking(e.target.checked ? true : null)} />
                    {onlineBooking === true && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">{locale === 'en' ? 'Online Booking' : (locale === 'kk' ? 'Онлайн жазылу' : 'Онлайн запись')}</span>
                </label>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{locale === 'kk' ? 'Мамандық' : 'Специальность'}</h3>
                <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="w-full h-12 bg-black/5 rounded-xl px-3 text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option value="">{locale === 'kk' ? 'Кез келген' : 'Любая'}</option>
                  <option value="Терапевт">Терапевт</option>
                  <option value="Кардиолог">Кардиолог</option>
                  <option value="Невропатолог">Невропатолог</option>
                  <option value="Гинеколог">Гинеколог</option>
                  <option value="ЛОР">ЛОР</option>
                </select>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{locale === 'kk' ? 'Қабылдау тілі' : 'Язык приема'}</h3>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full h-12 bg-black/5 rounded-xl px-3 text-sm outline-none focus:ring-1 focus:ring-primary">
                  <option value="">{locale === 'kk' ? 'Кез келген' : 'Любой'}</option>
                  <option value="ru">Русский</option>
                  <option value="kk">Қазақша</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${hasPromotion === true ? 'border-primary bg-primary' : 'border-gray-300 group-hover:border-primary'}`}>
                  <input type="checkbox" className="hidden" checked={hasPromotion === true} onChange={(e) => setHasPromotion(e.target.checked ? true : null)} />
                  {hasPromotion === true && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{locale === 'kk' ? 'Акциясы бар' : 'Есть акции'}</span>
              </label>

              <Button className="w-full mt-4" onClick={applyPriceFilter}>{t('search.apply')}</Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="hidden lg:block mb-6">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={t('search.searchPlaceholder')}
                    icon={<Search className="w-5 h-5 text-primary" />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-14 bg-white text-lg shadow-sm"
                  />
                </div>
                <Button className="h-14 px-8" onClick={() => handleSearch()}>{t('hero.searchButton')}</Button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h1 className="text-2xl font-bold text-foreground">
                {locale === 'en' ? 'Search Results' : (locale === 'kk' ? 'Іздеу нәтижелері' : 'Результаты поиска')} {initialQuery && (locale === 'en' ? `for "${initialQuery}"` : (locale === 'kk' ? `«${initialQuery}» бойынша` : `по запросу «${initialQuery}»`))} <span className="text-muted-foreground font-normal text-lg">({filteredResults.length})</span>
              </h1>
              
              {/* Sort By Select */}
              <div className="relative flex items-center bg-white border border-black/10 rounded-xl h-10 hover:border-primary/50 transition-colors shrink-0 min-w-[200px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-full bg-transparent pl-4 pr-8 appearance-none border-none outline-none text-sm font-medium cursor-pointer"
                >
                  <option value="">{locale === 'en' ? 'Sort by (Default)' : (locale === 'kk' ? 'Сұрыптау (Үнсіз)' : 'Сортировка (По умолчанию)')}</option>
                  <option value="price_asc">{locale === 'en' ? 'Price: Low to High' : (locale === 'kk' ? 'Баға: Өсуі бойынша' : 'Цена: По возрастанию')}</option>
                  <option value="price_desc">{locale === 'en' ? 'Price: High to Low' : (locale === 'kk' ? 'Баға: Кемуі бойынша' : 'Цена: По убыванию')}</option>
                  <option value="date_desc">{locale === 'en' ? 'Date: Newest First' : (locale === 'kk' ? 'Күні: Алдымен жаңа' : 'Дата: Сначала новые')}</option>
                </select>
                <svg className="w-4 h-4 text-muted-foreground absolute right-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center shadow-sm">
                <p>{error}</p>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="space-y-6">
                {filteredResults.map((result, index) => (
                  <motion.div
                    key={result.service.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 hover:border-primary/20 transition-all"
                  >
                    <div className="mb-6 border-b border-black/5 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md inline-block">
                              {result.service.category}
                            </span>
                            <button
                              onClick={() => toggleFavorite(result)}
                              className={`p-1.5 rounded-full transition-colors ${favorites[result.service.id] ? 'bg-rose-50 text-rose-500' : 'bg-black/5 text-muted-foreground hover:bg-rose-50 hover:text-rose-500'}`}
                            >
                              <Heart className={`w-4 h-4 ${favorites[result.service.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </button>
                          </div>
                          <h2 className="text-2xl font-bold mt-1">{result.service.name_raw}</h2>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{t('search.averagePrice')}</p>
                          <p className="font-medium text-lg">~{Math.round(result.avg_price).toLocaleString('ru-RU')} ₸</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        {t('search.bestOffer').replace('{count}', result.clinics_count.toString())}
                      </h3>

                      <ClinicCard
                        clinicId={result.best_offer_clinic.id}
                        clinicName={result.best_offer_clinic.name}
                        address={result.best_offer_clinic.address}
                        price={result.best_offer_price}
                        sourceUrl={result.best_offer_clinic.source_url ?? ""}
                        lastUpdatedAt={result.last_updated_at}
                        rating={result.best_offer_clinic.rating}
                        hasOnlineBooking={result.best_offer_clinic.has_online_booking}
                      />

                      <div className="pt-4 mt-4 border-t border-black/5">
                        <Link href={`/compare/${result.service.id}?city=${encodeURIComponent(city)}`}>
                          <Button variant="outline" className="w-full sm:w-auto ml-auto flex bg-blue-50 text-blue-600 border-transparent hover:bg-blue-600 hover:text-white transition-colors">
                            {t('search.comparePrices').replace('{count}', result.clinics_count.toString())} <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : initialQuery ? (
              <div className="bg-white p-10 rounded-3xl text-center shadow-sm border border-black/5">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('search.noResults')}</h3>
                <p className="text-muted-foreground">{t('search.searchPlaceholder')}</p>
              </div>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                {locale === 'en' ? 'Enter a service name to search' : (locale === 'kk' ? 'Іздеу үшін қызмет атауын енгізіңіз' : 'Введите название услуги для поиска')}
              </div>
            )}

          </main>

        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <SearchPageContent />
    </Suspense>
  )
}
