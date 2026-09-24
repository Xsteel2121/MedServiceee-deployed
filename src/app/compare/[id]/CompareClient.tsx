"use client"

import { startTransition, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { MapPin, Star, ChevronLeft, Navigation, Activity, CheckCircle2, Flame, Map as MapIcon, ArrowUpDown, Search, Table2, Loader2, BrainCircuit } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { GlassCard } from "@/components/ui/GlassCard"
import { DoctorProfileModal } from "@/components/DoctorProfileModal"
import { useTranslation } from "@/i18n/LanguageContext"
import { API_URL } from "@/lib/api"
import type { Doctor, Price, Service } from "@/lib/types"
import DynamicMap from "@/components/ui/DynamicMap"

export default function ComparePage() {
  const { t } = useTranslation();
  const params = useParams()
  const serviceId = params.id as string
  const searchParams = useSearchParams()
  const city = searchParams.get("city") || "Алматы"
  const [viewMode, setViewMode] = useState<"list" | "map" | "table">("list")
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null)
  const [bookingClinicId, setBookingClinicId] = useState<string | null>(null)
  const [bookingName, setBookingName] = useState("")
  const [bookingPhone, setBookingPhone] = useState("")
  const [bookingError, setBookingError] = useState("")
  const [bookingLoading, setBookingLoading] = useState(false)
  const [isBookingComplete, setIsBookingComplete] = useState(false)

  const [expandedClinic, setExpandedClinic] = useState<string | null>(null)
  const [clinicDoctors, setClinicDoctors] = useState<Record<string, Doctor[]>>({})
  const [loadingDoctors, setLoadingDoctors] = useState<Record<string, boolean>>({})
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)

  const [mapClinic, setMapClinic] = useState<{ name: string, address: string, latitude?: number | null, longitude?: number | null } | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [prices, setPrices] = useState<Price[]>([])
  const [service, setService] = useState<Service | null>(null)

  useEffect(() => {
    startTransition(() => {
      setLoading(true)
      setError("")
    })
    fetch(`${API_URL}/api/prices/${serviceId}?city=${encodeURIComponent(city)}`)
      .then(async res => {
        if (!res.ok) throw new Error("Не удалось загрузить цены")
        const data: unknown = await res.json()
        if (!Array.isArray(data)) throw new Error("Некорректный ответ API цен")
        return data as Price[]
      })
      .then(data => {
        setPrices(data)
        if (data.length > 0) {
          setService(data[0].service)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError(err instanceof Error ? err.message : "Не удалось загрузить цены")
        setPrices([])
        setLoading(false)
      })
  }, [serviceId, city])

  const toggleDoctors = async (clinicId: string) => {
    if (expandedClinic === clinicId) {
      setExpandedClinic(null);
      return;
    }

    setExpandedClinic(clinicId);

    if (!clinicDoctors[clinicId]) {
      setLoadingDoctors(prev => ({ ...prev, [clinicId]: true }));
      try {
        const res = await fetch(`${API_URL}/api/clinics/${clinicId}`);
        if (!res.ok) throw new Error("Не удалось загрузить врачей")
        const data = await res.json();
        setClinicDoctors(prev => ({ ...prev, [clinicId]: data.doctors || [] }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDoctors(prev => ({ ...prev, [clinicId]: false }));
      }
    }
  };

  const handleBook = (clinicName: string, clinicId?: string) => {
    setSelectedClinic(clinicName)
    setBookingClinicId(clinicId ?? null)
    setBookingError("")
    setIsBookingComplete(false)
  }

  const submitBooking = async () => {
    if (!bookingClinicId || !bookingName.trim() || !bookingPhone.trim()) {
      setBookingError("Укажите имя и телефон")
      return
    }
    setBookingLoading(true)
    setBookingError("")
    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinic_id: bookingClinicId, name: bookingName.trim(), phone: bookingPhone.trim() }),
      })
      if (!response.ok) throw new Error("Не удалось отправить заявку")
      setIsBookingComplete(true)
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Не удалось отправить заявку")
    } finally {
      setBookingLoading(false)
    }
  }

  const handleRoute = (clinicName: string, address: string, latitude?: number | null, longitude?: number | null) => {
    setMapClinic({ name: clinicName, address, latitude, longitude })
  }

  const openMap = (provider: '2gis' | 'google') => {
    if (!mapClinic) return;
    const query = encodeURIComponent(`${mapClinic.name}, ${mapClinic.address}, ${city}`)
    const destination = mapClinic.latitude != null && mapClinic.longitude != null
      ? `${mapClinic.latitude},${mapClinic.longitude}`
      : query
    if (provider === '2gis') {
      const route = mapClinic.latitude != null && mapClinic.longitude != null
        ? `https://2gis.kz/routeSearch/rsType/auto/to/${mapClinic.longitude},${mapClinic.latitude}`
        : `https://2gis.kz/search/${query}`
      window.open(route, '_blank', 'noopener,noreferrer')
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank', 'noopener,noreferrer')
    }
    setMapClinic(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!loading && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold mb-2">Ошибка загрузки</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Повторить</Button>
      </div>
    )
  }

  if (!loading && prices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold mb-2">{t('compare.notFound')} {city}</h2>
        <Button onClick={() => window.history.back()}>{t('compare.goBack')}</Button>
      </div>
    )
  }

  const sortedPrices = [...prices].sort((a, b) => a.price_kzt - b.price_kzt);
  const minPrice = sortedPrices.length > 0 ? sortedPrices[0].price_kzt : 0;
  const maxPrice = sortedPrices.length > 0 ? sortedPrices[sortedPrices.length - 1].price_kzt : 0;

  const clinicsList = sortedPrices.map(p => {
    const rating = p.clinic.rating || 4.5;
    const price = p.price_kzt;

    // AI Score calculation: Price / Quality Ratio
    // We normalize rating (0 to 5) and price (min to max). 
    // High rating is good, low price is good.
    const normalizedRating = rating / 5.0;
    const normalizedPrice = maxPrice > minPrice ? 1 - ((price - minPrice) / (maxPrice - minPrice)) : 1;

    // Weight: 60% rating (quality), 40% price. Just an example AI formula
    const aiScore = (normalizedRating * 0.6) + (normalizedPrice * 0.4);

    return {
      id: p.clinic.id,
      name: p.clinic.name,
      city: p.clinic.city,
      price: price,
      rating: rating,
      reviews: p.clinic.reviews_count || 10,
      address: p.clinic.address,
      distance: "Около 2-3 км",
      updated: new Date(p.parsed_at || new Date()).toLocaleDateString('ru-RU'),
      savings: maxPrice - price,
      lat: p.clinic.latitude,
      lng: p.clinic.longitude,
      aiScore: aiScore,
      isBestOffer: false,
      isAiChoice: false
    }
  });

  const bestPriceClinic = clinicsList.length > 0 ? clinicsList[0] : null;
  const aiChoiceClinic = [...clinicsList].sort((a, b) => b.aiScore - a.aiScore)[0];

  // Mark flags on clinics
  clinicsList.forEach(c => {
    c.isBestOffer = c.id === bestPriceClinic?.id;
    c.isAiChoice = c.id === aiChoiceClinic?.id;
  });

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Header Area */}
      <div className="bg-white border-b border-black/5 pt-6 pb-8 sticky top-20 z-40">
        <div className="container mx-auto max-w-[1440px] px-4">
          <Link href={`/search?q=${encodeURIComponent(service?.name_raw || '')}&city=${encodeURIComponent(city)}`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6">
            <ChevronLeft className="w-4 h-4 mr-1" /> {t('compare.backToResults')}
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">{service?.name_raw}</h1>
                <Badge variant="ai" className="hidden sm:flex text-sm py-1.5"><Activity className="w-4 h-4 mr-1" /> AI Unified</Badge>
              </div>
              <p className="text-muted-foreground max-w-2xl">
                {t('compare.shownOffers')} {city}. {t('compare.totalFound')}: {clinicsList.length}.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-black/5 p-1 rounded-xl">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "shadow-sm" : ""}
              >
                {t('compare.list')}
              </Button>
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className={viewMode === "table" ? "shadow-sm" : ""}
              >
                <Table2 className="w-4 h-4 mr-2" /> {t('compare.table')}
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("map")}
                className={viewMode === "map" ? "shadow-sm" : ""}
              >
                <MapIcon className="w-4 h-4 mr-2" /> {t('compare.onMap')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DoctorProfileModal
        doctor={selectedDoctor}
        isOpen={selectedDoctor !== null}
        onClose={() => setSelectedDoctor(null)}
      />

      <div className="container mx-auto max-w-[1440px] px-4 pt-8">

        {viewMode === "list" ? (
          <div className="flex flex-col lg:flex-row gap-8">

            {/* List View Main Content */}
            <div className="flex-1 space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Choice Highlight */}
                {aiChoiceClinic && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <GlassCard className="border-indigo-200 bg-indigo-50/50 p-6 flex flex-col justify-between h-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BrainCircuit className="w-24 h-24 text-indigo-500" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                            <BrainCircuit className="w-3 h-3 mr-1.5" /> {t('compare.aiChoice')}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{aiChoiceClinic.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center mb-6">
                          <MapPin className="w-3.5 h-3.5 mr-1" /> {aiChoiceClinic.address}
                        </p>

                        <div className="flex items-end justify-between mt-auto">
                          <div>
                            <div className="flex items-center gap-1 text-sm font-medium mb-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-bold">{aiChoiceClinic.rating}</span>
                              <span className="text-muted-foreground">({aiChoiceClinic.reviews})</span>
                            </div>
                            <div className="text-2xl font-bold text-indigo-700">{aiChoiceClinic.price.toLocaleString('ru-RU')} ₸</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleBook(aiChoiceClinic.name, aiChoiceClinic.id)}>{t('search.book')}</Button>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* Best Offer Highlight */}
                {bestPriceClinic && bestPriceClinic.id !== aiChoiceClinic?.id && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                    <GlassCard className="border-orange-200 bg-orange-50/50 p-6 flex flex-col justify-between h-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Flame className="w-24 h-24 text-orange-500" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center">
                            <Flame className="w-3 h-3 mr-1.5" /> {t('compare.lowestPrice')}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{bestPriceClinic.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center mb-6">
                          <MapPin className="w-3.5 h-3.5 mr-1" /> {bestPriceClinic.address}
                        </p>

                        <div className="flex items-end justify-between mt-auto">
                          <div>
                            <div className="flex items-center gap-1 text-sm font-medium mb-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-bold">{bestPriceClinic.rating}</span>
                              <span className="text-muted-foreground">({bestPriceClinic.reviews})</span>
                            </div>
                            <div className="text-2xl font-bold text-orange-700">{bestPriceClinic.price.toLocaleString('ru-RU')} ₸</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleBook(bestPriceClinic.name, bestPriceClinic.id)}>{t('search.book')}</Button>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </div>

              {/* Table / List Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-white rounded-xl border border-black/5 text-sm font-semibold text-muted-foreground mt-8">
                <div className="col-span-4">{t('compare.clinic')}</div>
                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"><ArrowUpDown className="w-4 h-4" /> {t('compare.price')}</div>
                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"><ArrowUpDown className="w-4 h-4" /> {t('compare.rating')}</div>
                <div className="col-span-2">{t('compare.address')}</div>
                <div className="col-span-2 text-right">{t('compare.action')}</div>
              </div>

              {/* All Clinics List */}
              <div className="space-y-4">
                {clinicsList.map((clinic, index) => (
                  <motion.div
                    key={clinic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <GlassCard
                      className={`p-4 md:p-6 bg-white hover:border-primary/30 transition-colors cursor-pointer ${expandedClinic === clinic.id ? 'border-primary/50 ring-1 ring-primary/20' : ''}`}
                      onClick={() => toggleDoctors(clinic.id)}
                    >
                      <div className="md:grid md:grid-cols-12 md:gap-4 md:items-center">
                        {/* Mobile View / Grid Col 1 */}
                        <div className="col-span-4 mb-4 md:mb-0">
                          <h4 className="font-bold text-lg flex items-center gap-2">
                            {clinic.name}
                            {clinic.isAiChoice && <span title={t('compare.aiChoice')}><BrainCircuit className="w-4 h-4 text-indigo-500" /></span>}
                            {clinic.isBestOffer && <span title={t('compare.lowestPrice')}><Flame className="w-4 h-4 text-orange-500" /></span>}
                          </h4>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500 mr-1" /> {t('compare.updated')} {clinic.updated}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="col-span-2 mb-2 md:mb-0">
                          <span className="md:hidden text-xs text-muted-foreground mr-2">{t('compare.price')}:</span>
                          <span className="font-bold text-lg text-primary">{clinic.price.toLocaleString('ru-RU')} ₸</span>
                        </div>

                        {/* Rating */}
                        <div className="col-span-2 mb-2 md:mb-0 flex items-center gap-1">
                          <span className="md:hidden text-xs text-muted-foreground mr-2">{t('compare.rating')}:</span>
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{clinic.rating}</span>
                          <span className="text-xs text-muted-foreground">({clinic.reviews})</span>
                        </div>

                        {/* Address */}
                        <div className="col-span-2 mb-4 md:mb-0">
                          <div className="text-sm font-medium">{clinic.address}</div>
                          <div className="text-xs text-muted-foreground">{clinic.distance}</div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="shrink-0 bg-black/5 hover:bg-black/10" onClick={(e) => { e.stopPropagation(); handleRoute(clinic.name, clinic.address, clinic.lat, clinic.lng); }}>
                            <Navigation className="w-4 h-4 text-primary" />
                          </Button>
                          <Button variant="outline" className="w-full md:w-auto" onClick={(e) => { e.stopPropagation(); handleBook(clinic.name, clinic.id); }}>{t('compare.choose')}</Button>
                        </div>
                      </div>

                      {/* Expandable Doctors Section */}
                      {expandedClinic === clinic.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="mt-6 pt-6 border-t border-black/5 overflow-hidden"
                        >
                          <h5 className="font-bold text-sm text-muted-foreground mb-4 uppercase tracking-wider">{t('search.doctors')}</h5>
                          {loadingDoctors[clinic.id] ? (
                            <div className="flex justify-center p-4">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                          ) : clinicDoctors[clinic.id] && clinicDoctors[clinic.id].length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {clinicDoctors[clinic.id].map((doc) => (
                                <div
                                  key={doc.id}
                                  onClick={(e) => { e.stopPropagation(); setSelectedDoctor(doc); }}
                                  className="flex gap-4 p-4 border border-black/5 rounded-2xl bg-black/5 hover:bg-black/10 transition-colors cursor-pointer"
                                >
                                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-black/5 bg-white">
                                    <Image src={doc.photo_url ?? doc.photo ?? "/file.svg"} alt={doc.first_name || doc.name || "Doctor"} width={48} height={48} unoptimized className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h6 className="font-bold text-sm">{doc.first_name ? `${doc.first_name} ${doc.last_name}` : doc.name}</h6>
                                        <p className="text-xs text-primary font-medium mb-1">{doc.specialty}</p>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs font-semibold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                                        <Star className="w-3 h-3 fill-current" /> {doc.rating}
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-2 text-xs">
                                      <span className="text-muted-foreground">Стаж: {doc.experience_years || doc.experience} лет</span>
                                      <span className="font-bold text-foreground text-sm">{(doc.consultation_price || doc.price || 0).toLocaleString('ru-RU')} ₸</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground p-4 bg-black/5 rounded-xl text-center">
                              {t('search.noResults')}
                            </div>
                          )}
                        </motion.div>
                      )}

                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        ) : viewMode === "map" ? (
          <div className="h-[70vh] w-full relative rounded-3xl overflow-hidden border border-black/10 shadow-lg">
            <DynamicMap clinics={clinicsList} />

            <div className="absolute top-4 left-4 bg-white p-4 rounded-2xl shadow-xl z-10 w-80">
              <Input placeholder="Искать рядом..." icon={<Search className="w-4 h-4" />} className="h-10 mb-4" />
            </div>

            <div className="absolute top-1/2 left-1/2 -mt-10 -ml-5 z-20 cursor-pointer">
              <div className="bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg border-2 border-white relative flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" />
                {aiChoiceClinic?.price.toLocaleString('ru-RU')} ₸
                <div className="absolute -bottom-2 left-1/2 -ml-1 w-2 h-2 bg-indigo-600 transform rotate-45"></div>
              </div>
            </div>

            {aiChoiceClinic && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white p-4 rounded-2xl shadow-2xl z-30 flex items-center gap-4 border-t-4 border-indigo-500">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <Badge variant="ai" className="text-[10px] px-1 py-0">AI</Badge>
                  </div>
                  <h4 className="font-bold text-lg mb-1">{aiChoiceClinic.name}</h4>
                  <div className="flex items-center gap-1 text-sm mb-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">{aiChoiceClinic.rating}</span>
                  </div>
                  <div className="text-2xl font-bold text-indigo-700">{aiChoiceClinic.price.toLocaleString('ru-RU')} ₸</div>
                </div>
                <div className="flex flex-col gap-2 w-1/3">
                  <Button size="sm" className="w-full" onClick={() => handleBook(aiChoiceClinic.name, aiChoiceClinic.id)}>{t('search.book')}</Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => handleRoute(aiChoiceClinic.name, aiChoiceClinic.address, aiChoiceClinic.lat, aiChoiceClinic.lng)}><Navigation className="w-4 h-4 mr-1" /> {t('search.route')}</Button>
                </div>
              </motion.div>
            )}

          </div>
        ) : viewMode === "table" ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="py-4 px-6 font-semibold text-muted-foreground">{t('compare.clinic')}</th>
                  <th className="py-4 px-6 font-semibold text-muted-foreground">{t('compare.price')} (₸)</th>
                  <th className="py-4 px-6 font-semibold text-muted-foreground">{t('compare.rating')}</th>
                  <th className="py-4 px-6 font-semibold text-muted-foreground">{t('compare.address')}</th>
                  <th className="py-4 px-6 font-semibold text-muted-foreground text-right">{t('compare.action')}</th>
                </tr>
              </thead>
              <tbody>
                {clinicsList.map((clinic) => (
                  <tr key={clinic.id} className={`border-b border-black/5 hover:bg-black/5 transition-colors ${clinic.isAiChoice ? 'bg-indigo-50/50 hover:bg-indigo-50/80' : clinic.isBestOffer ? 'bg-orange-50/50 hover:bg-orange-50/80' : ''}`}>
                    <td className="py-4 px-6">
                      <div className="font-bold text-lg flex items-center gap-2">
                        {clinic.name}
                        {clinic.isAiChoice && <BrainCircuit className="w-4 h-4 text-indigo-500" />}
                        {clinic.isBestOffer && !clinic.isAiChoice && <Flame className="w-4 h-4 text-orange-500" />}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className={`font-bold text-lg ${clinic.isAiChoice ? 'text-indigo-700' : 'text-primary'}`}>{clinic.price.toLocaleString('ru-RU')} ₸</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        {clinic.rating} <span className="text-muted-foreground font-normal">({clinic.reviews})</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{clinic.address} <span className="opacity-70">({clinic.distance})</span></span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button size="sm" className="w-full max-w-[140px]" onClick={() => handleBook(clinic.name, clinic.id)}>{t('search.book')}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* Booking Modal */}
      {selectedClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setSelectedClinic(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-black">
              <ChevronLeft className="w-6 h-6 rotate-180" />
            </button>

            {isBookingComplete ? (
              <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Заявка сохранена</h2>
                <p className="text-muted-foreground mb-8">
                  Запрос на приём в <strong>{selectedClinic}</strong> сохранён. Время не подтверждено клиникой; пожалуйста, уточните запись по её официальному телефону.
                </p>
                <Button className="w-full" onClick={() => setSelectedClinic(null)}>Понятно, спасибо</Button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6">Запись в клинику</h2>
                <div className="bg-black/5 p-4 rounded-xl mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Выбрана клиника:</p>
                  <p className="font-bold">{selectedClinic}</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Ваше имя</label>
                    <Input placeholder="Иван Иванов" value={bookingName} onChange={(event) => setBookingName(event.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Номер телефона</label>
                    <Input placeholder="+7 (777) 000-00-00" type="tel" value={bookingPhone} onChange={(event) => setBookingPhone(event.target.value)} />
                  </div>
                </div>

                {bookingError && <p className="text-sm text-red-600 mb-3">{bookingError}</p>}
                <Button className="w-full h-12 text-lg" disabled={bookingLoading} onClick={() => void submitBooking()}>
                  {bookingLoading ? "Отправка..." : "Оставить заявку"}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Selection Modal */}
      {mapClinic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setMapClinic(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-black">
              <ChevronLeft className="w-6 h-6 rotate-180" />
            </button>

            <h2 className="text-2xl font-bold mb-2">{t('routeModal.title')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('routeModal.desc')} <strong>{mapClinic.name}</strong>.
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-14 justify-start text-lg font-medium border-2 hover:border-primary/50 hover:bg-primary/5"
                onClick={() => openMap('2gis')}
              >
                <div className="w-8 h-8 rounded bg-[#a4cd39] flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                {t('routeModal.open2gis')}
              </Button>
              <Button
                variant="outline"
                className="w-full h-14 justify-start text-lg font-medium border-2 hover:border-primary/50 hover:bg-primary/5"
                onClick={() => openMap('google')}
              >
                <div className="w-8 h-8 rounded bg-[#4285F4] flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                {t('routeModal.openGoogle')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
