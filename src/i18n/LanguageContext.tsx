"use client";

import React, { createContext, useContext, useSyncExternalStore } from 'react';
import { dictionaries, Locale } from './dictionaries';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LOCALE_EVENT = 'medservice-locale-change';

function subscribeLocale(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(LOCALE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(LOCALE_EVENT, callback);
  };
}

function getLocaleSnapshot(): Locale {
  const savedLocale = localStorage.getItem('locale') as Locale | null;
  return savedLocale && savedLocale in dictionaries ? savedLocale : 'ru';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale: Locale = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, (): Locale => 'ru');
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem('locale', newLocale);
    window.dispatchEvent(new Event(LOCALE_EVENT));
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = dictionaries[locale];
    
    for (const k of keys) {
      if (isRecord(value) && k in value) {
        value = value[k];
      } else {
        // Fallback to ru
        let fallbackValue: unknown = dictionaries.ru;
        for (const fk of keys) {
          if (isRecord(fallbackValue) && fk in fallbackValue) {
            fallbackValue = fallbackValue[fk];
          } else {
            return key;
          }
        }
        return typeof fallbackValue === 'string' ? fallbackValue : key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null; 
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
