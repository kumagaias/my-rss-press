'use client';

import { useTranslations, type Locale } from '@/lib/i18n';

interface EditorialColumnProps {
  content: string;
  locale: Locale;
}

/**
 * Editorial Column Component
 * 
 * Displays an AI-generated editorial column in the style of
 * traditional newspaper editorials.
 * 
 * Features:
 * - Styled box with border and background
 * - Multi-language title
 * - Responsive design
 * - Serif font for traditional feel
 */
export function EditorialColumn({ content, locale }: EditorialColumnProps) {
  const t = useTranslations(locale);

  // Parse title and column from content
  // Format: "Title\n\nColumn content"
  const [title, ...columnParts] = content.split('\n\n');
  const column = columnParts.join('\n\n');

  return (
    <div className="mt-12 pt-8 border-t-2 border-gray-800">
      <div className="bg-amber-50 border-2 border-gray-800 p-6 md:p-8 rounded shadow-sm">
        {/* Section Label */}
        <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4 border-b border-gray-400 pb-2">
          {locale === 'ja' ? 'コラム' : "Editor's Note"}
        </div>

        {/* Column Title */}
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 font-serif">
          {title}
        </h2>

        {/* Column Content */}
        <div className="text-base md:text-lg leading-relaxed text-gray-800 font-serif whitespace-pre-line">
          {column}
        </div>
      </div>
    </div>
  );
}
