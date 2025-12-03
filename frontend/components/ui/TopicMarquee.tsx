import React, { useRef, useState, useEffect } from 'react';

interface TopicMarqueeProps {
  keywords: string[];
  onKeywordClick: (keyword: string) => void;
}

export function TopicMarquee({ keywords, onKeywordClick }: TopicMarqueeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Duplicate keywords for seamless loop
  const duplicatedKeywords = [...keywords, ...keywords, ...keywords];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setIsPaused(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => setIsPaused(false), 100);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setTimeout(() => setIsPaused(false), 100);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    if (!isDragging) {
      onKeywordClick(keyword);
    }
  };

  return (
    <div className="relative overflow-hidden bg-white border-t-2 border-b-2 border-black py-3">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto scrollbar-hide whitespace-nowrap cursor-grab active:cursor-grabbing"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`flex ${!isPaused ? 'animate-marquee-ltr' : ''}`}>
          {duplicatedKeywords.map((keyword, index) => (
            <button
              key={`${keyword}-${index}`}
              onClick={() => handleKeywordClick(keyword)}
              className="inline-block mx-4 px-4 py-1 font-serif text-sm border border-black hover:bg-black hover:text-white transition-colors cursor-pointer select-none"
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
