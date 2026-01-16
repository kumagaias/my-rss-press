'use client';

import Link from 'next/link';
import { useTranslations, type Locale } from '@/lib/i18n';

interface HeaderProps {
  locale: Locale;
  onLocaleChange?: (locale: Locale) => void;
}

export function Header({ locale, onLocaleChange }: HeaderProps) {
  const t = useTranslations(locale);

  return (
    <header className="border-b-4 border-black bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-center items-center relative gap-4 sm:gap-0">
          <Link href="/" className="block text-center hover:opacity-80 transition-opacity border-l-4 border-r-4 border-black px-4 py-2">
            <h1 className="text-2xl sm:text-4xl font-serif font-black">
              {t.appName}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 italic mt-1">
              {t.appTagline}
            </p>
          </Link>
          {onLocaleChange && (
            <div className="sm:absolute sm:right-0">
              <select
                value={locale}
                onChange={(e) => onLocaleChange(e.target.value as Locale)}
                className="px-4 py-2 min-h-[44px] text-sm font-serif font-bold border-2 border-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
              >
                <option value="en">🇺🇸 English</option>
                <option value="ja">🇯🇵 日本語</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
