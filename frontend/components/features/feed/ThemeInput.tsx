'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ThemeInputProps {
  onSubmit: (theme: string) => void;
  isLoading: boolean;
  locale: 'en' | 'ja';
}

/**
 * ThemeInput Component
 * 
 * Allows users to input their interest theme for RSS feed suggestions.
 * Validates input to ensure it's not empty or whitespace-only.
 */
export function ThemeInput({ onSubmit, isLoading, locale }: ThemeInputProps) {
  const [theme, setTheme] = useState('');
  const [error, setError] = useState<string | null>(null);

  const placeholder = locale === 'ja' 
    ? '興味のあるテーマを入力してください（例：テクノロジー、スポーツ）'
    : 'Enter your interest theme (e.g., Technology, Sports)';

  const buttonText = locale === 'ja' ? 'フィード提案を取得' : 'Get Feed Suggestions';
  const errorEmpty = locale === 'ja' 
    ? 'テーマを入力してください'
    : 'Please enter a theme';
  const errorWhitespace = locale === 'ja'
    ? '有効なテーマを入力してください'
    : 'Please enter a valid theme';

  /**
   * Validate theme input
   * - Must not be empty
   * - Must not be whitespace-only
   */
  const validateTheme = (value: string): boolean => {
    if (value.length === 0) {
      setError(errorEmpty);
      return false;
    }

    if (value.trim().length === 0) {
      setError(errorWhitespace);
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
          placeholder={placeholder}
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
        {buttonText}
      </Button>
    </form>
  );
}
