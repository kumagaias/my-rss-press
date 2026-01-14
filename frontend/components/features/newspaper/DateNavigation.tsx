'use client';

import { useTranslations, type Locale } from '@/lib/i18n';

interface DateNavigationProps {
  currentDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
  locale: Locale;
  isLoading?: boolean;
}

/**
 * Date navigation component for browsing historical newspapers
 * Allows users to navigate to previous/next day with validation
 */
export default function DateNavigation({
  currentDate,
  onDateChange,
  locale,
  isLoading = false,
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

  // Calculate 7 days ago (retention period limit)
  // Newspapers older than 7 days are automatically deleted by cleanup service
  const sevenDaysAgo = new Date(todayJST);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Check if previous day would be available (not older than 7 days)
  // We need to check if the PREVIOUS day (current - 1) would be within the 7-day window
  // Use > (not >=) to prevent navigation to exactly 7 days ago
  // Example: If today is 2026-01-08, sevenDaysAgo is 2026-01-01
  // - Current: 2026-01-02, Previous would be: 2026-01-01 (== sevenDaysAgo) → Hide button
  // - Current: 2026-01-03, Previous would be: 2026-01-02 (> sevenDaysAgo) → Show button
  const previousDay = new Date(current);
  previousDay.setDate(previousDay.getDate() - 1);
  const canGoPrevious = previousDay > sevenDaysAgo;

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
    <div className="grid grid-cols-[140px_1fr_140px] items-center gap-4 py-4 max-w-4xl mx-auto">
      {/* Previous button - fixed width column */}
      <div className="flex justify-end">
        {canGoPrevious && (
          <button
            onClick={handlePrevious}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
            aria-label={t.previousDay || 'Previous day'}
          >
            ← {t.previousDay || 'Previous'}
          </button>
        )}
      </div>

      {/* Date display - flexible center column */}
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-800">
          {formattedDate}
        </div>
      </div>

      {/* Next button - fixed width column */}
      <div className="flex justify-start">
        {canGoNext && (
          <button
            onClick={handleNext}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
            aria-label={t.nextDay || 'Next day'}
          >
            {t.nextDay || 'Next'} →
          </button>
        )}
      </div>
    </div>
  );
}
