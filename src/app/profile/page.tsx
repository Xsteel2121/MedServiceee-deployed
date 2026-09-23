"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Crown, Loader2, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { API_URL } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Booking {
  id: string;
  doctor_name?: string | null;
  clinic_name?: string | null;
  appointment_at?: string | null;
  preferred_time?: string | null;
  status: string;
  total_amount?: number | null;
  discount_amount?: number;
  priority_booking?: boolean;
}

interface Account {
  email: string;
  full_name?: string | null;
  plan: "free" | "pro" | "premium";
  ai_requests_used: number;
  ai_limit?: number | null;
  priority_booking: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const updatePlan = async (plan: "free" | "pro" | "premium") => {
    try {
      const response = await fetch(`${API_URL}/api/subscriptions/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) return;
      setAccount(await response.json() as Account);
    } catch {
      setError("Не удалось обновить тариф");
    }
  };

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/auth/me`, { credentials: "include" }),
      fetch(`${API_URL}/api/bookings/me`, { credentials: "include" }),
    ]).then(async ([accountResponse, bookingsResponse]) => {
      if (accountResponse.status === 401 || bookingsResponse.status === 401) {
        router.push("/login");
        return;
      }
      if (!accountResponse.ok || !bookingsResponse.ok) throw new Error("Не удалось загрузить профиль");
      setAccount(await accountResponse.json() as Account);
      setBookings(await bookingsResponse.json() as Booking[]);
    }).catch((requestError: unknown) => {
      setError(requestError instanceof Error ? requestError.message : "Не удалось загрузить профиль");
    }).finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !account) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-red-600 mb-4">{error || "Профиль не найден"}</p><Button onClick={() => router.push("/login")}>Войти</Button></div></div>;

  return (
    <div className="container mx-auto max-w-[1100px] px-4 py-8 pb-24">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">Личный кабинет</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{account.full_name || account.email}</h1>
          {account.plan === "premium" && <Badge variant="ai"><Crown className="w-3.5 h-3.5 mr-1" /> PREMIUM · Приоритетная запись</Badge>}
          {account.plan === "pro" && <Badge variant="ai">PRO · AI без лимита</Badge>}
        </div>
        <p className="text-muted-foreground mt-2">{account.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">Тариф</p>
          <p className="text-2xl font-bold uppercase">{account.plan}</p>
          <div className="flex gap-2 mt-4">
            <Button size="sm" variant="outline" onClick={() => void updatePlan("pro")}>PRO</Button>
            <Button size="sm" onClick={() => void updatePlan("premium")}>PREMIUM</Button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">AI-запросы</p>
          <p className="text-2xl font-bold">{account.ai_limit == null ? "∞" : `${account.ai_requests_used}/${account.ai_limit}`}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">Записи</p>
          <p className="text-2xl font-bold">{bookings.length}</p>
        </div>
      </div>

      <section className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Мои записи</h2>
        </div>
        {bookings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Записей пока нет</div>
        ) : (
          <div className="divide-y divide-border">
            {bookings.map((booking) => (
              <div key={booking.id} className="p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-bold">{booking.doctor_name || "Приём врача"}</p>
                  <p className="text-sm text-primary">{booking.clinic_name || "Клиника"}</p>
                  <p className="text-sm text-muted-foreground mt-1">{booking.appointment_at ? new Date(booking.appointment_at).toLocaleString("ru-RU") : booking.preferred_time || "Время уточняется"}</p>
                </div>
                <div className="flex items-center gap-3">
                  {booking.priority_booking && <Badge variant="best"><Star className="w-3 h-3 mr-1" /> Приоритет</Badge>}
                  <span className="text-sm font-medium">{booking.status === "new" ? "Новая" : booking.status}</span>
                  {booking.total_amount != null && <span className="font-bold">{booking.total_amount.toLocaleString("ru-RU")} ₸</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
