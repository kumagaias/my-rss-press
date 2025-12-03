import React from 'react';

interface TopicMarqueeProps {
  keywords: string[];
  onKeywordClick: (keyword: string) => void;
}

export function TopicMarquee({ keywords, onKeywordClick }: TopicMarqueeProps) {
  // Duplicate keywords for seamless loop
  const duplicatedKeywords = [...keywords, ...keywords];

  return (
    <div className="relative overflow-hidden bg-white border-t-2 border-b-2 border-black py-3">
      <div className="flex animate-marquee-ltr whitespace-nowrap">
        {duplicatedKeywords.map((keyword, index) => (
          <button
            key={`${keyword}-${index}`}
            onClick={() => onKeywordClick(keyword)}
            className="inline-block mx-4 px-4 py-1 font-serif text-sm border border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            {keyword}
          </button>
        ))}
      </div>
    </div>
  );
}
