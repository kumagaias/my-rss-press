'use client';

import { useState } from 'react';
import { Locale, useTranslations } from '@/lib/i18n';

interface ThemeInputProps {
  onSubmit: (theme: string) => void;
  isLoading: boolean;
  locale: Locale;
}

export default function ThemeInput({ onSubmit, isLoading, locale }: ThemeInputProps) {
  const [theme, setTheme] = useState('');
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations(locale);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!theme.trim()) {
      setError(t.themeInputError);
      return;
    }
    
    setError(null);
    onSubmit(theme);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          {t.appName}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {t.appTagline}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
              {t.themeInputLabel}
            </label>
            <input
              id="theme"
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder={t.themeInputPlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              disabled={isLoading}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400"
          >
            {isLoading ? t.processing : t.suggestFeedsButton}
          </button>
        </form>
      </div>
    </div>
  );
}
