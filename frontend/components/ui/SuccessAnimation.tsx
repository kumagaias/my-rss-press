'use client';

import { useEffect, useRef } from 'react';
import type { Locale } from '@/types';

interface SuccessAnimationProps {
  onScrollToGenerate?: () => void;
  locale?: Locale;
}

/**
 * SuccessAnimation Component
 * 
 * Displays a success checkmark animation with a down arrow
 * Clicking the arrow scrolls to the generate newspaper button
 */
export function SuccessAnimation({ onScrollToGenerate, locale = 'ja' }: SuccessAnimationProps) {
  const checkmarkRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Trigger checkmark animation on mount
    if (checkmarkRef.current) {
      checkmarkRef.current.classList.add('animate-checkmark');
    }
  }, []);

  const successText = locale === 'ja' ? 'フィード準備完了！' : 'Feeds Ready!';
  const generateText = locale === 'ja' ? '新聞を生成する' : 'Generate your newspaper';

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      {/* Success checkmark */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-green-600 rounded-full animate-scale-in"></div>
        <svg
          ref={checkmarkRef}
          className="absolute inset-0 w-16 h-16"
          viewBox="0 0 52 52"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="checkmark-path"
            fill="none"
            stroke="#16a34a"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 27l7 7 16-16"
          />
        </svg>
      </div>

      {/* Success text */}
      <p className="text-lg font-serif font-bold text-green-700">
        {successText}
      </p>

      {/* Down arrow button */}
      <button
        onClick={onScrollToGenerate}
        className="flex flex-col items-center space-y-2 group cursor-pointer hover:opacity-80 transition-opacity"
        aria-label="Scroll to generate button"
      >
        <p className="text-sm font-serif text-gray-600">
          {generateText}
        </p>
        <div className="animate-bounce">
          <svg
            className="w-8 h-8 text-black group-hover:text-green-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </button>
    </div>
  );
}
