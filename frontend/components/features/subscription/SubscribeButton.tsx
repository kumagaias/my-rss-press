'use client';

import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useTranslations, type Locale } from '@/lib/i18n';

interface SubscribeButtonProps {
  newspaperId: string;
  newspaperTitle?: string; // Optional: newspaper title to store with subscription
  variant: 'icon-only' | 'full';
  locale: Locale;
  className?: string;
}

export function SubscribeButton({
  newspaperId,
  newspaperTitle,
  variant,
  locale,
  className = '',
}: SubscribeButtonProps) {
  const t = useTranslations(locale);
  const { isSubscribed, toggleSubscription, isAtLimit } = useSubscriptions();

  const subscribed = isSubscribed(newspaperId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click handlers
    toggleSubscription(newspaperId, newspaperTitle);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Support Enter and Space keys
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      toggleSubscription(newspaperId, newspaperTitle);
    }
  };

  // Don't show subscribe button if at limit and not already subscribed
  if (!subscribed && isAtLimit) {
    return null;
  }

  if (variant === 'icon-only') {
    return (
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-transform hover:scale-110 ${className}`}
        aria-label={subscribed ? t.subscribed : t.subscribe}
        title={subscribed ? t.subscribed : t.subscribe}
      >
        {subscribed ? (
          // Filled heart
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-8 h-8 text-red-600"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        ) : (
          // Outlined heart
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8 text-black"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        )}
      </button>
    );
  }

  // Full variant
  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`px-4 py-2 min-h-[44px] text-sm font-serif font-bold border-2 border-black transition-colors flex items-center gap-2 ${
        subscribed
          ? 'bg-red-600 text-white hover:bg-red-700'
          : 'bg-white text-black hover:bg-gray-50'
      } ${className}`}
      aria-label={subscribed ? t.subscribed : t.subscribe}
    >
      {subscribed ? (
        // Filled heart
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
      ) : (
        // Outlined heart
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      )}
      <span>{subscribed ? t.subscribed : t.subscribe}</span>
    </button>
  );
}
