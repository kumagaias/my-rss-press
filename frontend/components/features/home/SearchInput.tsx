'use client';

import { useTranslations, type Locale } from '@/lib/i18n';

interface SearchInputProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  locale: Locale;
}

/**
 * Search input component for filtering newspapers by keyword
 * Searches in newspaper title and feed URLs
 */
export default function SearchInput({
  searchQuery,
  onSearchChange,
  locale,
}: SearchInputProps) {
  const t = useTranslations(locale);

  const placeholder =
    locale === 'ja'
      ? '新聞名やフィードURLで検索...'
      : 'Search by newspaper name or feed URL...';

  return (
    <div className="w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          aria-label={placeholder}
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={locale === 'ja' ? '検索をクリア' : 'Clear search'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
