"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Clock, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { API_URL } from "@/lib/api";
import type { ClinicDetail } from "@/lib/types";
import type { Doctor } from "@/lib/types";
import { DoctorProfileModal } from "@/components/DoctorProfileModal";

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ClinicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"services" | "doctors">("services");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");

  useEffect(() => {
    async function fetchClinic() {
      if (!params.id) return;
      try {
        const res = await fetch(`${API_URL}/api/clinics/${params.id}`);
        if (!res.ok) {
          throw new Error("Clinic not found");
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load clinic details");
      } finally {
        setLoading(false);
      }
    }
    fetchClinic();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.back()}>Назад</Button>
        </div>
      </div>
    );
  }

  const clinic = data.clinic;
  const services = data.services;
  const doctors = data.doctors || [];

  const submitClinicReview = async () => {
    if (!reviewRating) return;
    setReviewStatus("");
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clinic_id: clinic.id, rating: reviewRating, comment: reviewComment.trim() || undefined }),
      });
      if (!response.ok) throw new Error("Не удалось отправить отзыв");
      const created = await response.json() as { average_rating?: number; reviews_count?: number };
      setData((previous) => previous ? { ...previous, clinic: { ...previous.clinic, rating: created.average_rating ?? previous.clinic.rating, reviews_count: created.reviews_count ?? previous.clinic.reviews_count } } : previous);
      setReviewStatus("Спасибо за отзыв");
      setReviewComment("");
    } catch (reviewError: unknown) {
      setReviewStatus(reviewError instanceof Error ? reviewError.message : "Не удалось отправить отзыв");
    }
  };

  return (
    <div className="container mx-auto max-w-[1440px] px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад к списку
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Clinic Info & Map */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h1 className="text-2xl font-bold mb-3">{clinic.name}</h1>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center text-amber-500 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full text-sm">
                <Star className="w-4 h-4 fill-current mr-1" />
                {clinic.rating || "N/A"}
              </div>
              <span className="text-muted-foreground text-sm">
                ({clinic.reviews_count || 0} отзывов)
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Адрес</p>
                  <p className="text-sm text-muted-foreground">{clinic.city}, {clinic.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Телефон</p>
                  <p className="text-sm text-muted-foreground">{clinic.phone || "Не указан"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Время работы</p>
                  <p className="text-sm text-muted-foreground">{clinic.working_hours || "Не указано"}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {clinic.source_url ? (
                <a href={clinic.source_url} target="_blank" rel="noopener noreferrer" className="block mb-4">
                  <Button className="w-full">Записаться на сайте клиники</Button>
                </a>
              ) : (
                <Button className="w-full mb-4">Записаться на прием</Button>
              )}
              {clinic.latitude != null && clinic.longitude != null ? (
                  <div className="w-full h-48 bg-muted rounded-xl overflow-hidden border border-border">
                    <iframe
                      title={`Карта ${clinic.name}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${clinic.latitude},${clinic.longitude}&z=15&output=embed`}
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <a className="flex-1" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinic.name}, ${clinic.city}, ${clinic.address}`)}`}>
                      <Button variant="outline" className="w-full">Google Maps</Button>
                    </a>
                    <a className="flex-1" target="_blank" rel="noopener noreferrer" href={`https://2gis.kz/search/${encodeURIComponent(`${clinic.name}, ${clinic.city}, ${clinic.address}`)}`}>
                      <Button variant="outline" className="w-full">2GIS</Button>
                    </a>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Right Column: Services & Doctors List */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="flex border-b border-border bg-muted/20">
              <button
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-4 text-center font-semibold transition-colors ${activeTab === 'services' ? 'bg-white border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-black/5'}`}
              >
                Прайс-лист ({services.length})
              </button>
              <button
                onClick={() => setActiveTab('doctors')}
                className={`flex-1 py-4 text-center font-semibold transition-colors ${activeTab === 'doctors' ? 'bg-white border-b-2 border-primary text-primary' : 'text-muted-foreground hover:bg-black/5'}`}
              >
                Врачи ({doctors.length})
              </button>
            </div>

            <div className="divide-y divide-border">
              {activeTab === 'services' ? (
                services.length > 0 ? (
                  services.map((priceItem) => (
                    <div key={priceItem.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                      <div>
                        <div className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">
                          {priceItem.service?.category}
                        </div>
                        <h3 className="font-medium text-lg">{priceItem.service?.name_raw}</h3>
                      </div>
                      <div className="flex items-center gap-4 sm:shrink-0">
                        <div className="text-right">
                          <div className="text-2xl font-bold">{priceItem.price_kzt.toLocaleString('ru-RU')} ₸</div>
                        </div>
                        <Button size="sm">Выбрать</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Нет данных об услугах
                  </div>
                )
              ) : (
                doctors.length > 0 ? (
                  doctors.map((doctor) => (
                    <div key={doctor.id} className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-muted/10 transition-colors">
                      <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden bg-muted border border-border">
                        <Image src={doctor.photo_url ?? "/file.svg"} alt={`${doctor.first_name} ${doctor.last_name}`} width={80} height={80} unoptimized className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg">{doctor.first_name} {doctor.last_name}</h3>
                            <p className="text-primary font-medium text-sm mb-1">{doctor.specialty}</p>
                            <p className="text-muted-foreground text-sm line-clamp-2">{doctor.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full text-xs mb-1 justify-end">
                              <Star className="w-3 h-3 fill-current mr-1" />
                              {doctor.rating}
                            </div>
                            <span className="text-muted-foreground text-xs">{doctor.reviews_count} отзывов</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                          <div>Стаж: <strong>{doctor.experience_years ?? 0} лет</strong></div>
                          <div>Прием: <strong className="text-foreground">{(doctor.consultation_price ?? 0).toLocaleString('ru-RU')} ₸</strong></div>
                        </div>
                      </div>
                      <div className="sm:self-center shrink-0">
                        <Button className="w-full sm:w-auto" onClick={() => setSelectedDoctor(doctor)}>Записаться</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Нет информации о врачах
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-semibold text-lg mb-3">Оценить клинику</h2>
        <div className="flex items-center gap-1 mb-3" aria-label="Оценка от 1 до 5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" onClick={() => setReviewRating(value)} className="p-1 text-amber-500" aria-label={`${value} звезд`}>
              <Star className={`w-5 h-5 ${value <= reviewRating ? "fill-current" : ""}`} />
            </button>
          ))}
        </div>
        <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Ваш отзыв" maxLength={2000} className="w-full min-h-20 px-3 py-2 rounded-xl border border-black/10 bg-black/5 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none text-sm" />
        <Button size="sm" className="mt-3" disabled={!reviewRating} onClick={() => void submitClinicReview()}>Отправить отзыв</Button>
        {reviewStatus && <p className="text-sm text-muted-foreground mt-2">{reviewStatus}</p>}
      </div>
      <DoctorProfileModal
        doctor={selectedDoctor}
        isOpen={selectedDoctor !== null}
        onClose={() => setSelectedDoctor(null)}
      />
    </div>
  );
}
