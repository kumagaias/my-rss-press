'use client';

import { useTranslations, type Locale } from '@/lib/i18n';

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
  const t = useTranslations(locale);

  const languages = [
    { value: 'ALL' as const, label: locale === 'ja' ? 'すべて' : 'All' },
    { value: 'JP' as const, label: locale === 'ja' ? '日本語' : 'Japanese' },
    { value: 'EN' as const, label: locale === 'ja' ? '英語' : 'English' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">
        {locale === 'ja' ? '言語:' : 'Language:'}
      </span>
      <div className="flex gap-2">
        {languages.map((lang) => (
          <button
            key={lang.value}
            onClick={() => onLanguageChange(lang.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedLanguage === lang.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            aria-label={`Filter by ${lang.label}`}
            aria-pressed={selectedLanguage === lang.value}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
