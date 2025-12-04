'use client';

interface LoadingAnimationProps {
  locale?: 'en' | 'ja';
}

/**
 * LoadingAnimation Component
 * 
 * Displays an animated loading indicator showing AI fetching feeds
 * Uses newspaper-themed animation with dots and waves
 */
export function LoadingAnimation({ locale = 'en' }: LoadingAnimationProps) {
  const text = locale === 'ja' 
    ? 'AIが最適なフィードを探しています...'
    : 'AI is finding the best feeds for you...';

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      {/* Animated dots representing AI processing */}
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      
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
