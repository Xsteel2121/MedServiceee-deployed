"use client"

import Link from "next/link"
import { Search, Heart, User, Menu, LogOut, Network, Command } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/i18n/LanguageContext"
import { API_URL } from "@/lib/api"
import { Badge } from "@/components/ui/Badge"

export function Navbar() {
  const { t, locale, setLocale } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
         setIsAuthenticated(response.ok);
         if (response.ok) {
           const user = await response.json() as { plan?: string };
           setPlan(user.plan || "free");
         } else {
           setPlan(null);
         }
      } catch {
        setIsAuthenticated(false);
        setPlan(null);
      }
    }, 0);
    return () => window.clearTimeout(checkAuth);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // Clear the local session even if the backend is temporarily unavailable.
    } finally {
      setIsAuthenticated(false);
      setPlan(null);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="container mx-auto max-w-[1440px] px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-sm">
              M
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
              MedService<span className="text-primary">Price</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/search" className="hover:text-primary transition-colors">{t('navbar.services')}</Link>
            <Link href="/clinics" className="hover:text-primary transition-colors">{t('navbar.clinics')}</Link>
            <Link href="/promotions" className="hover:text-primary transition-colors">{t('navbar.promotions')}</Link>
            <Link href="/about" className="hover:text-primary transition-colors">{t('navbar.about')}</Link>
            <Link href="/decision-map" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"><Network className="w-4 h-4" /> Карта решений</Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 mr-2">
            <button type="button" onClick={() => window.dispatchEvent(new Event("open-command-palette"))} className="focus-ring hidden xl:inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary" aria-label="Открыть командную палитру">
              <Command className="w-3.5 h-3.5" /> <span>Поиск</span><kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">⌘K</kbd>
            </button>
            <Link href="/search">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5">
                <Search className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/favorites">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5 text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                <Heart className="w-5 h-5" />
              </Button>
            </Link>
          </div>
          
          <div className="flex gap-1 ml-2 mr-2">
            <button onClick={() => setLocale('ru')} className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${locale === 'ru' ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>RU</button>
            <button onClick={() => setLocale('kk')} className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${locale === 'kk' ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>KK</button>
            <button onClick={() => setLocale('en')} className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${locale === 'en' ? 'bg-primary text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>EN</button>
          </div>

          <Link href="/for-clinics" className="hidden sm:flex">
            <Button variant="outline" className="rounded-full">
              {t('navbar.forClinics')}
            </Button>
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-black/5" aria-label="Профиль">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              {plan === "premium" && <Badge variant="ai" className="hidden sm:inline-flex">PREMIUM · Приоритет</Badge>}
              {plan === "pro" && <Badge variant="ai" className="hidden sm:inline-flex">PRO</Badge>}
              <Button onClick={handleLogout} variant="outline" className="rounded-full border-zinc-200 hover:bg-zinc-100">
                <LogOut className="w-4 h-4 mr-2 text-zinc-600" />
                <span className="text-zinc-800">{t('navbar.logout')}</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button className="rounded-full shadow-glow">
                <User className="w-4 h-4 mr-2" />
                {t('navbar.login')}
              </Button>
            </Link>
          )}
          
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-white border-b border-black/10 shadow-lg py-4 px-4 flex flex-col gap-4 z-40">
          <Link href="/search" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>{t('navbar.services')}</Link>
          <Link href="/clinics" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>{t('navbar.clinics')}</Link>
          <Link href="/promotions" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>{t('navbar.promotions')}</Link>
          <Link href="/about" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>{t('navbar.about')}</Link>
          <Link href="/decision-map" className="text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>Карта решений</Link>
          <Link href="/for-clinics" className="text-lg font-medium sm:hidden" onClick={() => setIsMobileMenuOpen(false)}>{t('navbar.forClinics')}</Link>
        </div>
      )}
    </header>
  )
}
