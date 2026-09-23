"use client";

import Link from "next/link"
import { useTranslation } from "@/i18n/LanguageContext"

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-white border-t border-gray-100 pb-20 md:pb-0 mt-20">
      <div className="container mx-auto max-w-[1440px] px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
                M
              </div>
              <span className="font-bold tracking-tight">
                MedService<span className="text-primary">Price</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6">
              {t('footer.subtitle')}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('footer.forPatients')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/search" className="hover:text-primary">{t('footer.searchServices')}</Link></li>
              <li><Link href="/clinics" className="hover:text-primary">{t('footer.clinicsCatalog')}</Link></li>
              <li><Link href="/promotions" className="hover:text-primary">{t('footer.promos')}</Link></li>
              <li><Link href="/reviews" className="hover:text-primary">{t('footer.reviews')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('footer.forClinics')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/partners" className="hover:text-primary">{t('footer.becomePartner')}</Link></li>
              <li><Link href="/business" className="hover:text-primary">{t('footer.dashboard')}</Link></li>
              <li><Link href="/api" className="hover:text-primary">{t('footer.api')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t('footer.service')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary">{t('footer.aboutUs')}</Link></li>
              <li><Link href="/contacts" className="hover:text-primary">{t('footer.contacts')}</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">{t('footer.privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-primary">{t('footer.terms')}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 MedServicePrice.kz. {t('footer.rights')}
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Казахстан, Алматы</span>
            <span>support@medserviceprice.kz</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
