'use client';

import type { Locale } from '@/types';

interface LoadingAnimationProps {
  locale?: Locale;
}

/**
 * LoadingAnimation Component
 * 
 * Displays an animated loading indicator showing AI fetching feeds
 * Uses newspaper-themed animation with dots and waves
 */
export function LoadingAnimation({ locale = 'ja' }: LoadingAnimationProps) {
  const text = locale === 'ja' 
    ? 'AIが最適なフィードを探しています...'
    : 'AI is finding the best feeds for you...';

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      {/* Text */}
      <p className="text-sm font-serif text-gray-700 animate-pulse">
        {text}
      </p>
      
      {/* Wave animation */}
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-black rounded-full animate-wave"
            style={{
              height: '20px',
              animationDelay: `${i * 100}ms`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}
