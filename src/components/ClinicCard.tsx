"use client";

import { useState } from "react"
import Image from "next/image"
import { MapPin, ExternalLink, Activity, Users, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { GlassCard } from "@/components/ui/GlassCard"
import PriceChart from "@/components/ui/PriceChart"
import { DoctorProfileModal } from "@/components/DoctorProfileModal"
import { useTranslation } from "@/i18n/LanguageContext"
import { API_URL } from "@/lib/api"
import type { Doctor } from "@/lib/types"

interface ClinicProps {
  clinicId?: string
  clinicName: string
  address: string
  price: number
  sourceUrl?: string | null
  lastUpdatedAt?: string
  rating?: number
  hasOnlineBooking?: boolean
}

export function ClinicCard({ clinicId, clinicName, address, price, sourceUrl, lastUpdatedAt, rating, hasOnlineBooking }: ClinicProps) {
  const { t, locale } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const handleShowDoctors = async () => {
    if (!showDoctors && doctors.length === 0 && clinicId) {
      setLoadingDoctors(true);
      try {
        const res = await fetch(`${API_URL}/api/clinics/${clinicId}`);
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors || []);
        }
      } catch { }
      setLoadingDoctors(false);
    }
    setShowDoctors(!showDoctors);
  };

  // Generate test history data for MVP based on current price
  const historyBase = new Date(lastUpdatedAt || "2024-01-01T00:00:00.000Z").getTime();
  const historyData = [
    { date: new Date(historyBase - 30 * 24 * 60 * 60 * 1000).toISOString(), price: Math.round(price * 1.1) },
    { date: new Date(historyBase - 15 * 24 * 60 * 60 * 1000).toISOString(), price: Math.round(price * 1.05) },
    { date: new Date(historyBase).toISOString(), price },
  ];

  return (
    <GlassCard className="p-5 flex flex-col hover:shadow-lg transition-all border-black/5 hover:border-primary/20">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between w-full">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-xl font-bold text-foreground">{clinicName}</h3>
            {rating && (
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded text-sm font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" /> {rating.toFixed(1)}
              </div>
            )}
            {hasOnlineBooking && (
              <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Онлайн запись
              </div>
            )}
          </div>
          <div className="flex items-center text-muted-foreground text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            {address}
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
          <div className="flex flex-col items-end">
            <div className="text-2xl font-bold text-gradient">
              {price.toLocaleString('ru-RU')} ₸
            </div>
            {lastUpdatedAt && (
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 flex items-center justify-end gap-1.5 opacity-80">
                <Clock className="w-3 h-3 shrink-0" />
                <span>
                  {locale === 'kk' ? 'Соңғы жаңарту:' : locale === 'en' ? 'Last updated:' : 'Актуально на:'} {new Date(lastUpdatedAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(lastUpdatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={handleShowDoctors}
              className="w-full flex justify-center items-center gap-1.5 md:gap-2 px-2 md:px-4"
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('search.doctors')}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex justify-center items-center gap-1.5 md:gap-2 px-2 md:px-4"
            >
              <Activity className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('search.history')}</span>
            </Button>
            <Button
              onClick={() => {
                if (sourceUrl) {
                  window.open(sourceUrl, '_blank', 'noopener,noreferrer');
                } else if (clinicId) {
                  window.location.assign(`/clinics/${encodeURIComponent(clinicId)}`);
                }
              }}
              disabled={!sourceUrl && !clinicId}
              className="col-span-2 md:col-span-1 w-full flex justify-center items-center gap-2"
            >
              {t('search.book')} <ExternalLink className="w-4 h-4 shrink-0" />
            </Button>
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="mt-6 w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <PriceChart data={historyData} />
        </div>
      )}

      {showDoctors && (
        <div className="mt-6 pt-6 border-t border-black/5 animate-in fade-in slide-in-from-top-4 duration-300">
          <h4 className="font-bold mb-4 text-muted-foreground uppercase tracking-wider text-sm">{t('search.doctors')}</h4>
          {loadingDoctors ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : doctors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoctor(doc)}
                  className="flex gap-4 p-4 border border-black/5 rounded-2xl bg-black/5 hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-black/5 bg-white">
                    <Image src={doc.photo_url ?? "/file.svg"} alt={doc.first_name} width={48} height={48} unoptimized className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h6 className="font-bold text-sm">{doc.first_name} {doc.last_name}</h6>
                        <p className="text-xs text-primary font-medium">{doc.specialty}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-current" /> {doc.rating}
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-2 text-xs">
                      <span className="text-muted-foreground">Стаж: {doc.experience_years ?? 0} лет</span>
                      <span className="font-bold text-foreground text-sm">{(doc.consultation_price ?? doc.price ?? 0).toLocaleString('ru-RU')} ₸</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">Нет информации о врачах</div>
          )}
        </div>
      )}

      <DoctorProfileModal
        doctor={selectedDoctor}
        isOpen={selectedDoctor !== null}
        onClose={() => setSelectedDoctor(null)}
      />
    </GlassCard>
  )
}
