'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTranslations } from '@/lib/i18n';

interface ThemeInputProps {
  onSubmit: (theme: string) => void;
  isLoading: boolean;
  locale: 'en' | 'ja';
  initialTheme?: string;
  buttonText?: string;
}

/**
 * ThemeInput Component
 * 
 * Allows users to input their interest theme for RSS feed suggestions.
 * Validates input to ensure it's not empty or whitespace-only.
 */
export function ThemeInput({ onSubmit, isLoading, locale, initialTheme = '', buttonText }: ThemeInputProps) {
  const [theme, setTheme] = useState(initialTheme);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations(locale);

  // Update theme when initialTheme changes (from keyword click)
  useEffect(() => {
    if (initialTheme) {
      setTheme(initialTheme);
    }
  }, [initialTheme]);

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
      onSubmit(theme.trim());
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTheme(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
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
