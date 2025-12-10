'use client';

interface LoadingAnimationProps {
  message?: string;
}

/**
 * LoadingAnimation Component
 * 
 * Displays a loading animation with an optional message.
 * Uses the same style as the feed suggestion loading animation.
 */
export function LoadingAnimation({ message }: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>

      {/* Message */}
      {message && (
        <p className="text-lg text-gray-700 font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
