'use client';

import { useState, useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { HamburgerMenu } from '@/components/ui/HamburgerMenu';
import { Header } from '@/components/ui/Header';
import { detectLocale, type Locale } from '@/lib/i18n';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [locale, setLocale] = useState<Locale>(() => {
    // During SSR, return 'en' as default
    if (typeof window === 'undefined') return 'en';
    
    // On client, check localStorage first, then detect from browser
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    return savedLocale || detectLocale();
  });

  // Check if we're on newspaper creation page (temp ID or no ID)
  const isNewspaperCreation = pathname === '/newspaper' && (
    !searchParams.get('id') || 
    searchParams.get('id')?.startsWith('temp-')
  );

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
      <div className="fixed top-[1.25rem] left-4 z-50">
        <HamburgerMenu locale={locale} />
      </div>
      <Header 
        locale={locale} 
        onLocaleChange={isNewspaperCreation ? undefined : handleLocaleChange} 
      />
      {children}
    </>
  );
}

export function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <>
        <div className="fixed top-[1.25rem] left-4 z-50">
          <HamburgerMenu locale="en" />
        </div>
        <Header locale="en" />
        {children}
      </>
    }>
      <LayoutContent>{children}</LayoutContent>
    </Suspense>
  );
}
