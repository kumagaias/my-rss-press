'use client';

import { useState, useEffect } from 'react';
import { HamburgerMenu } from '@/components/ui/HamburgerMenu';
import { Header } from '@/components/ui/Header';
import { detectLocale, type Locale } from '@/lib/i18n';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    // During SSR, return 'en' as default
    if (typeof window === 'undefined') return 'en';
    
    // On client, check localStorage first, then detect from browser
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    return savedLocale || detectLocale();
  });

  // Save locale to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
      sessionStorage.setItem('newspaperLocale', locale); // Sync to newspaper page
      console.log('[LayoutClient] Locale changed to:', locale);
    }
  }, [locale]);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
  };

  return (
    <>
      <div className="fixed top-[2.5rem] left-4 z-50 transform -translate-y-1/2">
        <HamburgerMenu locale={locale} />
      </div>
      <Header locale={locale} onLocaleChange={handleLocaleChange} />
      {children}
    </>
  );
}
