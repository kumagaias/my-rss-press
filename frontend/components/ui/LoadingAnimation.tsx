'use client';

interface LoadingAnimationProps {
  message?: string;
  type?: 'feed' | 'newspaper'; // Type of animation
}

/**
 * LoadingAnimation Component
 * 
 * Displays a newspaper-themed loading animation with vertical bars.
 * - 'feed' type: Shows RSS feed collection animation
 * - 'newspaper' type: Shows pen writing animation
 */
export function LoadingAnimation({ message, type = 'newspaper' }: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Vertical bars animation */}
      <div className="flex gap-2 mb-6">
        <div 
          className="w-2 bg-black rounded-sm animate-pulse" 
          style={{ 
            height: '48px',
            animationDelay: '0ms',
            animationDuration: '1.2s'
          }}
        ></div>
        <div 
          className="w-2 bg-black rounded-sm animate-pulse" 
          style={{ 
            height: '48px',
            animationDelay: '150ms',
            animationDuration: '1.2s'
          }}
        ></div>
        <div 
          className="w-2 bg-black rounded-sm animate-pulse" 
          style={{ 
            height: '48px',
            animationDelay: '300ms',
            animationDuration: '1.2s'
          }}
        ></div>
        <div 
          className="w-2 bg-black rounded-sm animate-pulse" 
          style={{ 
            height: '48px',
            animationDelay: '450ms',
            animationDuration: '1.2s'
          }}
        ></div>
        <div 
          className="w-2 bg-black rounded-sm animate-pulse" 
          style={{ 
            height: '48px',
            animationDelay: '600ms',
            animationDuration: '1.2s'
          }}
        ></div>
      </div>

      {/* Icon animation based on type */}
      <div className="mb-4">
        {type === 'feed' ? (
          // RSS feed collection animation
          <div className="relative w-16 h-16">
            <svg 
              className="w-16 h-16 text-gray-800" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {/* RSS icon with pulsing circles */}
              <circle 
                cx="5" 
                cy="19" 
                r="2" 
                fill="currentColor"
              />
              <path 
                className="animate-ping" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 11a9 9 0 019 9"
                style={{ animationDuration: '2s' }}
              />
              <path 
                className="animate-ping" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4a16 16 0 0116 16"
                style={{ animationDuration: '2s', animationDelay: '0.5s' }}
              />
            </svg>
          </div>
        ) : (
          // Pen writing animation
          <div className="relative w-16 h-16">
            <svg 
              className="w-16 h-16 text-gray-800 animate-bounce" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ animationDuration: '1.5s' }}
            >
              {/* Pen icon */}
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            {/* Writing lines animation */}
            <div className="absolute -bottom-2 left-0 right-0 flex flex-col gap-1">
              <div 
                className="h-0.5 bg-gray-400 rounded animate-expand"
                style={{ animationDuration: '1.5s', animationIterationCount: 'infinite' }}
              ></div>
              <div 
                className="h-0.5 bg-gray-400 rounded animate-expand"
                style={{ animationDuration: '1.5s', animationDelay: '0.3s', animationIterationCount: 'infinite' }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <p className="text-lg text-gray-700 font-serif font-medium">
          {message}
        </p>
      )}
    </div>
  );
}
