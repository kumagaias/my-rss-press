'use client';

import { HamburgerMenu } from '@/components/ui/HamburgerMenu';
import { detectLocale } from '@/lib/i18n';

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const locale = detectLocale();

  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        <HamburgerMenu locale={locale} />
      </div>
      {children}
    </>
  );
}
