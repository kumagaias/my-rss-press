'use client';

interface LoadingAnimationProps {
  message?: string;
  type?: 'feed' | 'newspaper'; // Type of animation
}

/**
 * LoadingAnimation Component
 * 
 * Displays a newspaper-themed loading animation.
 * - 'feed' type: Shows wave-like bars animation (bars stretching up and down)
 * - 'newspaper' type: Shows pen writing animation only
 */
export function LoadingAnimation({ message, type = 'newspaper' }: LoadingAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {type === 'feed' ? (
        // Feed suggestion: Wave-like bars animation only
        <div className="flex items-end gap-2 mb-6 h-16">
          <div 
            className="bar w-2 bg-black rounded-sm animate-wave" 
            style={{ 
              animationDelay: '0ms',
            }}
          ></div>
          <div 
            className="bar w-2 bg-black rounded-sm animate-wave" 
            style={{ 
              animationDelay: '150ms',
            }}
          ></div>
          <div 
            className="bar w-2 bg-black rounded-sm animate-wave" 
            style={{ 
              animationDelay: '300ms',
            }}
          ></div>
          <div 
            className="bar w-2 bg-black rounded-sm animate-wave" 
            style={{ 
              animationDelay: '450ms',
            }}
          ></div>
          <div 
            className="bar w-2 bg-black rounded-sm animate-wave" 
            style={{ 
              animationDelay: '600ms',
            }}
          ></div>
        </div>
      ) : (
        // Newspaper generation: Pen animation only
        <div className="mb-4">
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
        </div>
      )}

      {/* Message */}
      {message && (
        <p className="text-lg text-gray-700 font-serif font-medium">
          {message}
        </p>
      )}

      <style jsx>{`
        @keyframes wave {
          0%, 100% {
            height: 16px;
          }
          50% {
            height: 48px;
          }
        }

        .animate-wave {
          animation: wave 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
