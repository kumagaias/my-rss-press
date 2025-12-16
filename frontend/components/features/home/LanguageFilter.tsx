'use client';

import type { Locale } from '@/lib/i18n';

interface LanguageFilterProps {
  selectedLanguage: 'JP' | 'EN' | 'ALL';
  onLanguageChange: (language: 'JP' | 'EN' | 'ALL') => void;
  locale: Locale;
}

/**
 * Language filter component for filtering newspapers by language
 * Defaults to JP for Japanese UI, EN for English UI
 */
export default function LanguageFilter({
  selectedLanguage,
  onLanguageChange,
  locale,
}: LanguageFilterProps) {

  const languages = [
    { value: 'ALL' as const, label: locale === 'ja' ? 'すべて' : 'All' },
    { value: 'JP' as const, label: locale === 'ja' ? '日本語' : 'Japanese' },
    { value: 'EN' as const, label: locale === 'ja' ? '英語' : 'English' },
  ];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-filter" className="text-sm font-serif font-bold whitespace-nowrap">
        {locale === 'ja' ? '言語:' : 'Language:'}
      </label>
      <select
        id="language-filter"
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value as 'JP' | 'EN' | 'ALL')}
        className="border-2 border-black px-3 py-2 font-serif bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black min-w-[140px]"
      >
        {languages.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
