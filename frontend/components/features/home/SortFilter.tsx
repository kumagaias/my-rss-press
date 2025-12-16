import type { Locale } from '@/types';
import { useTranslations } from '@/lib/i18n';

interface SortFilterProps {
  sortBy: 'popular' | 'recent';
  onSortChange: (sort: 'popular' | 'recent') => void;
  locale: Locale;
}

export default function SortFilter({ sortBy, onSortChange, locale }: SortFilterProps) {
  const t = useTranslations(locale);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-filter" className="text-sm font-serif font-bold whitespace-nowrap">
        {t.sortBy}:
      </label>
      <select
        id="sort-filter"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as 'popular' | 'recent')}
        className="border-2 border-black px-3 py-2 font-serif bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black min-w-[140px]"
      >
        <option value="popular">{t.popular}</option>
        <option value="recent">{t.recent}</option>
      </select>
    </div>
  );
}
