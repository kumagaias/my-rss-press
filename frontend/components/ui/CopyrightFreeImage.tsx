'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CopyrightFreeImageProps {
  theme: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Component that displays copyright-free images from Unsplash Source API
 * Falls back to a colored placeholder div if Unsplash fails
 */
export function CopyrightFreeImage({
  theme,
  alt,
  width = 800,
  height = 600,
  className = '',
}: CopyrightFreeImageProps) {
  const [imageError, setImageError] = useState(false);

  // Unsplash Source API URL
  const unsplashUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(theme)}`;

  const handleError = () => {
    setImageError(true);
  };

  // If image fails to load, show a simple placeholder div
  if (imageError) {
    return (
      <div
        className={`${className} bg-gray-200 flex items-center justify-center`}
        style={{ width: `${width}px`, height: `${height}px`, maxWidth: '100%' }}
      >
        <span className="text-gray-500 text-sm font-serif">
          {alt || 'Image'}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={unsplashUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      unoptimized // Unsplash URLs are external and dynamic
    />
  );
}
