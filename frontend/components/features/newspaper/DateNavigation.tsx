'use client';

import { useTranslations, type Locale } from '@/lib/i18n';

interface DateNavigationProps {
  currentDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
  locale: Locale;
}

/**
 * Date navigation component for browsing historical newspapers
 * Allows users to navigate to previous/next day with validation
 */
export default function DateNavigation({
  currentDate,
  onDateChange,
  locale,
}: DateNavigationProps) {
  const t = useTranslations(locale);

  // Parse current date in JST
  const current = new Date(currentDate + 'T00:00:00+09:00');

  // Get today in JST
  const nowJST = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' })
  );
  const todayJST = new Date(nowJST);
  todayJST.setHours(0, 0, 0, 0);

  // Calculate 7 days ago in JST
  const sevenDaysAgo = new Date(todayJST);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Check if previous day is available (not older than 7 days)
  const canGoPrevious = current > sevenDaysAgo;

  // Check if next day is available (not future)
  const canGoNext = current < todayJST;

  const handlePrevious = () => {
    if (!canGoPrevious) return;

    const previousDate = new Date(current);
    previousDate.setDate(previousDate.getDate() - 1);
    const dateString = previousDate.toISOString().split('T')[0];
    onDateChange(dateString);
  };

  const handleNext = () => {
    if (!canGoNext) return;

    const nextDate = new Date(current);
    nextDate.setDate(nextDate.getDate() + 1);
    const dateString = nextDate.toISOString().split('T')[0];
    onDateChange(dateString);
  };

  // Format date for display
  const formattedDate = current.toLocaleDateString(
    locale === 'ja' ? 'ja-JP' : 'en-US',
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Tokyo',
    }
  );

  return (
    <div className="flex items-center justify-center gap-4 py-4">
      <button
        onClick={handlePrevious}
        disabled={!canGoPrevious}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          canGoPrevious
            ? 'bg-gray-800 text-white hover:bg-gray-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        aria-label={t.previousDay || 'Previous day'}
      >
        ← {t.previousDay || 'Previous'}
      </button>

      <div className="text-center min-w-[200px]">
        <div className="text-lg font-semibold text-gray-800">
          {formattedDate}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!canGoNext}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          canGoNext
            ? 'bg-gray-800 text-white hover:bg-gray-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        aria-label={t.nextDay || 'Next day'}
      >
        {t.nextDay || 'Next'} →
      </button>
    </div>
  );
}
