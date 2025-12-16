import React, { useRef, useState, useMemo } from 'react';

interface TopicMarqueeProps {
  keywords: string[];
  onKeywordClick: (keyword: string) => void;
}

export function TopicMarquee({ keywords, onKeywordClick }: TopicMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

  // Shuffle keywords and duplicate for seamless loop
  // Use useMemo to re-shuffle when keywords change (e.g., locale change)
  const shuffledKeywords = useMemo(() => {
    const shuffled = [...keywords];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [keywords]);
  const duplicatedKeywords = [...shuffledKeywords, ...shuffledKeywords];

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setDragDistance(0);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
    containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeft - walk;
    setDragDistance(Math.abs(walk));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    }
  };

  const handleKeywordClick = (keyword: string) => {
    // Only trigger click if not dragging (drag distance < 5px)
    if (dragDistance < 5) {
      onKeywordClick(keyword);
    }
  };

  return (
    <div className="relative overflow-hidden bg-white border-t-2 border-b-2 border-black py-3">
      <div
        ref={containerRef}
        className="overflow-x-auto scrollbar-hide cursor-grab"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex whitespace-nowrap animate-marquee-slow">
          {duplicatedKeywords.map((keyword, index) => (
            <button
              key={`${keyword}-${index}`}
              onClick={() => handleKeywordClick(keyword)}
              onMouseDown={(e) => e.stopPropagation()}
              className="inline-block mx-4 px-4 py-1 font-serif text-sm border border-black hover:bg-black hover:text-white transition-colors cursor-pointer select-none flex-shrink-0"
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
