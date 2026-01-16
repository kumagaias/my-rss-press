'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatDate, useTranslations, type Locale } from '@/lib/i18n';
import type { SubscriptionItem, Newspaper } from '@/types';

interface SortableNewspaperCardProps {
  subscription: SubscriptionItem;
  newspaper?: Newspaper;
  onClick: () => void;
  locale: Locale;
}

export function SortableNewspaperCard({
  subscription,
  newspaper,
  onClick,
  locale,
}: SortableNewspaperCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subscription.id,
  });
  const t = useTranslations(locale);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border-4 border-black shadow-lg hover:shadow-xl transition-shadow"
    >
      <div className="flex items-center gap-4 p-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors"
          aria-label="Drag to reorder"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 9h16.5m-16.5 6.75h16.5"
            />
          </svg>
        </button>

        {/* Newspaper Info */}
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <h3 className="text-xl font-serif font-bold mb-1">
            {newspaper?.name || subscription.title || 'Loading...'}
          </h3>
          {newspaper && (
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                {t.createdBy}: {newspaper.userName || 'Anonymous'}
              </p>
              <p>
                {t.createdAt}: {formatDate(newspaper.createdAt, locale)}
              </p>
              <p>
                {t.subscribedOn}: {formatDate(subscription.subscribedAt, locale)}
              </p>
            </div>
          )}
          {!newspaper && (
            <p className="text-sm text-gray-500">{t.loading}</p>
          )}
        </div>

        {/* View Button */}
        <button
          onClick={onClick}
          className="min-w-[44px] min-h-[44px] px-6 py-2 bg-black text-white font-serif font-bold hover:bg-gray-800 transition-colors"
        >
          {t.readMore}
        </button>
      </div>
    </div>
  );
}
