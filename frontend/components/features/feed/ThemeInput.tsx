'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTranslations } from '@/lib/i18n';

interface ThemeInputProps {
  onSubmit: (theme: string, intent?: string) => void;
  isLoading: boolean;
  locale: 'en' | 'ja';
  initialTheme?: string;
  initialIntent?: string;
  buttonText?: string;
}

/**
 * ThemeInput Component
 * 
 * Allows users to input their interest theme for RSS feed suggestions.
 * Validates input to ensure it's not empty or whitespace-only.
 */
export function ThemeInput({
  onSubmit,
  isLoading,
  locale,
  initialTheme = '',
  initialIntent = '',
  buttonText,
}: ThemeInputProps) {
  const [theme, setTheme] = useState(initialTheme);
  const [intent, setIntent] = useState(initialIntent);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations(locale);

  // Update theme when initialTheme changes (from keyword click)
  useEffect(() => {
    if (initialTheme) {
      setTheme(initialTheme);
    }
  }, [initialTheme]);

  useEffect(() => {
    if (initialIntent) {
      setIntent(initialIntent);
    }
  }, [initialIntent]);

  /**
   * Validate theme input
   * - Must not be empty
   * - Must not be whitespace-only
   */
  const validateTheme = (value: string): boolean => {
    if (value.length === 0) {
      setError(t.themeEmpty);
      return false;
    }

    if (value.trim().length === 0) {
      setError(t.themeRequired);
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (validateTheme(theme)) {
      onSubmit(theme.trim(), intent.trim() || undefined);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleIntentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setIntent(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div>
        <Input
          type="text"
          placeholder={t.themeInputPlaceholder}
          value={theme}
          onChange={handleChange}
          error={error || undefined}
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="newspaper-intent" className="block font-serif font-bold text-sm mb-2">
          {t.newspaperIntentLabel}
        </label>
        <textarea
          id="newspaper-intent"
          placeholder={t.newspaperIntentPlaceholder}
          value={intent}
          onChange={handleIntentChange}
          disabled={isLoading}
          rows={5}
          maxLength={800}
          className="w-full border-2 border-black bg-white px-4 py-3 font-serif text-base focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:cursor-not-allowed resize-y"
        />
        <p className="mt-1 text-xs text-gray-600 font-serif">
          {t.newspaperIntentHelp}
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isLoading}
        loading={isLoading}
        className="w-full"
      >
        {buttonText || t.getFeedSuggestions}
      </Button>
    </form>
  );
}
