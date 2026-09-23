"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Star, Clock, Award, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Doctor } from "@/lib/types";
import { API_URL } from "@/lib/api";

interface DoctorModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DoctorProfileModal({ doctor, isOpen, onClose }: DoctorModalProps) {
  const [isBooked, setIsBooked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", date: "", time: "", promo_code: "" });
  const [slots, setSlots] = useState<{ starts_at: string; available: boolean }[]>([]);
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");

  useEffect(() => {
    if (!doctor || !showForm) return;
    const date = formData.date || new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    let cancelled = false;
    fetch(`${API_URL}/api/doctors/${doctor.id}/slots?date=${date}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось загрузить свободные слоты");
        return response.json() as Promise<{ starts_at: string; available: boolean }[]>;
      })
      .then((data) => { if (!cancelled) setSlots(data.filter((slot) => slot.available)); })
      .catch(() => { if (!cancelled) setSlots([]); });
    return () => { cancelled = true; };
  }, [doctor, showForm, formData.date]);

  const handleClose = () => {
    setIsBooked(false);
    setShowForm(false);
    setFormData({ name: "", phone: "", date: "", time: "", promo_code: "" });
    setBookingError("");
    setReviewRating(0);
    setReviewComment("");
    setReviewStatus("");
    onClose();
  };

  const submitReview = async () => {
    if (!reviewRating) return;
    setReviewStatus("");
    try {
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ doctor_id: doctor?.id, rating: reviewRating, comment: reviewComment.trim() || undefined }),
      });
      if (!response.ok) throw new Error("Не удалось отправить отзыв");
      setReviewStatus("Спасибо за отзыв");
      setReviewComment("");
    } catch (error: unknown) {
      setReviewStatus(error instanceof Error ? error.message : "Не удалось отправить отзыв");
    }
  };

  if (!isOpen || !doctor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200" onClick={handleClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors z-10">
          <X className="w-5 h-5" />
        </button>
        
        <div className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <Image src={doctor.photo_url ?? doctor.photo ?? "/file.svg"} alt={doctor.first_name || doctor.name || "Doctor"} width={96} height={96} unoptimized className="w-24 h-24 rounded-full border-4 border-primary/10 mb-4 object-cover" />
            <h2 className="text-2xl font-bold text-foreground">
              {doctor.first_name ? `${doctor.first_name} ${doctor.last_name}` : doctor.name}
            </h2>
            <p className="text-primary font-medium text-lg">{doctor.specialty}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-sm font-bold bg-amber-500/10 text-amber-600 px-2 py-1 rounded-md">
                <Star className="w-4 h-4 fill-current" /> {doctor.rating}
              </div>
              <span className="text-sm text-muted-foreground">{doctor.reviews_count} отзывов</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-black/5 p-4 rounded-2xl text-center">
              <Award className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground mb-1">Стаж работы</p>
              <p className="font-bold">{doctor.experience_years} лет</p>
            </div>
            <div className="bg-black/5 p-4 rounded-2xl text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground mb-1">Стоимость приема</p>
              <p className="font-bold">{(doctor.consultation_price || doctor.price || 0).toLocaleString('ru-RU')} ₸</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-lg mb-2">О враче</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {doctor.description || "Информация о враче не указана."}
            </p>
          </div>

          <div className="mb-8 rounded-2xl bg-black/5 p-4">
            <h3 className="font-bold text-lg mb-2">Оценить врача</h3>
            <div className="flex items-center gap-1 mb-3" aria-label="Оценка от 1 до 5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button key={value} type="button" onClick={() => setReviewRating(value)} className="p-1 text-amber-500" aria-label={`${value} звезд`}>
                  <Star className={`w-5 h-5 ${value <= reviewRating ? "fill-current" : ""}`} />
                </button>
              ))}
            </div>
            <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Ваш отзыв" maxLength={2000} className="w-full min-h-20 px-3 py-2 rounded-xl border border-black/10 bg-white focus:ring-2 focus:ring-primary focus:outline-none text-sm" />
            <Button size="sm" className="mt-3" disabled={!reviewRating} onClick={() => void submitReview()}>Отправить отзыв</Button>
            {reviewStatus && <p className="text-sm text-muted-foreground mt-2">{reviewStatus}</p>}
          </div>

          {showForm && !isBooked && (
            <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1 block">Ваше имя</label>
                <input 
                  type="text" 
                  placeholder="Иван Иванов" 
                  className="w-full h-12 px-4 rounded-xl border border-black/10 bg-black/5 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1 block">Телефон</label>
                  <input 
                    type="tel"
                    placeholder="+7 (777) 000-00-00"
                    className="w-full h-12 px-4 rounded-xl border border-black/10 bg-black/5 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground mb-1 block">Дата</label>
                  <input
                    type="date"
                    className="w-full h-12 px-4 rounded-xl border border-black/10 bg-black/5 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    min={new Date().toISOString().slice(0, 10)}
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value, time: ""})}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1 block">Свободный слот</label>
                <select
                  className="w-full h-12 px-4 rounded-xl border border-black/10 bg-black/5 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                >
                  <option value="">Выберите время</option>
                  {slots.map((slot) => <option key={slot.starts_at} value={slot.starts_at}>{new Date(slot.starts_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-1 block">Промокод</label>
                <input
                  type="text"
                  placeholder="WELCOME10"
                  className="w-full h-12 px-4 rounded-xl border border-black/10 bg-black/5 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  value={formData.promo_code}
                  onChange={e => setFormData({...formData, promo_code: e.target.value.toUpperCase()})}
                />
              </div>
              {bookingError && <p className="text-sm text-red-600">{bookingError}</p>}
            </div>
          )}

          <Button 
            className={`w-full h-14 text-lg transition-all ${isBooked ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
            onClick={() => {
              if (!showForm && !isBooked) {
                const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
                setFormData((prev) => ({ ...prev, date: prev.date || tomorrow }));
                setShowForm(true);
              } else if (showForm && !isBooked) {
                setBookingLoading(true);
                setBookingError("");
                fetch(`${API_URL}/api/bookings`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    clinic_id: doctor.clinic_id,
                    doctor_id: doctor.id,
                    name: formData.name,
                    phone: formData.phone,
                    preferred_time: formData.time,
                    appointment_at: formData.time,
                    promo_code: formData.promo_code || undefined,
                  }),
                }).then(async (response) => {
                  if (!response.ok) {
                    const payload = await response.json().catch(() => null) as { detail?: string } | null;
                    throw new Error(payload?.detail || "Не удалось создать запись");
                  }
                  setIsBooked(true);
                  setShowForm(false);
                }).catch((error: unknown) => setBookingError(error instanceof Error ? error.message : "Не удалось создать запись"))
                  .finally(() => setBookingLoading(false));
              }
            }}
            disabled={isBooked || bookingLoading || (showForm && (!formData.name || !formData.phone || !formData.time || !doctor.clinic_id))}
          >
            {isBooked ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> Заявка отправлена
              </span>
            ) : showForm ? (
              "Отправить заявку"
            ) : (
              "Записаться на прием"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
