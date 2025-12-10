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

  // Parse current date as UTC midnight for consistent comparison
  const [year, month, day] = currentDate.split('-').map(Number);
  const current = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  // Get today in JST and convert to UTC midnight
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000; // JST is UTC+9 in milliseconds
  const jstTime = new Date(now.getTime() + jstOffset);
  
  // Extract date components from JST time
  const todayYear = jstTime.getUTCFullYear();
  const todayMonth = jstTime.getUTCMonth();
  const todayDay = jstTime.getUTCDate();
  
  // Create today's date at UTC midnight for comparison
  const todayJST = new Date(Date.UTC(todayYear, todayMonth, todayDay, 0, 0, 0, 0));

  // Calculate 7 days ago
  const sevenDaysAgo = new Date(todayJST);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Check if previous day is available (not older than 7 days)
  const canGoPrevious = current > sevenDaysAgo;

  // Check if next day is available (not future)
  const canGoNext = current < todayJST;

  const handlePrevious = () => {
    if (!canGoPrevious) return;

    // Create date in UTC to avoid timezone issues
    const [year, month, day] = currentDate.split('-').map(Number);
    const previousDate = new Date(Date.UTC(year, month - 1, day - 1));
    const dateString = previousDate.toISOString().split('T')[0];
    onDateChange(dateString);
  };

  const handleNext = () => {
    if (!canGoNext) return;

    // Create date in UTC to avoid timezone issues
    const [year, month, day] = currentDate.split('-').map(Number);
    const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
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
