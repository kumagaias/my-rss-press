'use client';

import { useState } from 'react';
import { HamburgerMenu } from '@/components/ui/HamburgerMenu';
import { detectLocale } from '@/lib/i18n';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const [locale] = useState(() => detectLocale());

  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        <HamburgerMenu locale={locale} />
      </div>
      {children}
    </>
  );
}
