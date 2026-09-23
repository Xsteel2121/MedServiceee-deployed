"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Map, Heart, User } from "lucide-react"
import { cn } from "@/lib/utils"

import { useTranslation } from "@/i18n/LanguageContext"

const navItems = [
  { icon: Home, id: "home", href: "/" },
  { icon: Search, id: "search", href: "/search" },
  { icon: Map, id: "map", href: "/clinics" },
  { icon: Heart, id: "favorites", href: "/favorites" },
  { icon: User, id: "profile", href: "/login" },
]

export function BottomNav() {
  const pathname = usePathname()
  const { locale } = useTranslation()

  const getLabel = (id: string) => {
    switch (id) {
      case 'home': return locale === 'en' ? 'Home' : (locale === 'kk' ? 'Басты бет' : 'Главная');
      case 'search': return locale === 'en' ? 'Search' : (locale === 'kk' ? 'Іздеу' : 'Поиск');
      case 'map': return locale === 'en' ? 'Map' : (locale === 'kk' ? 'Карта' : 'Карта');
      case 'favorites': return locale === 'en' ? 'Favorites' : (locale === 'kk' ? 'Таңдаулы' : 'Избранное');
      case 'profile': return locale === 'en' ? 'Profile' : (locale === 'kk' ? 'Профиль' : 'Профиль');
      default: return '';
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t pb-safe border-gray-100">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{getLabel(item.id)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
