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
 * Falls back to local placeholder if Unsplash fails
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

  // Local placeholder image path
  const placeholderUrl = '/images/placeholder-newspaper.jpg';

  const handleError = () => {
    setImageError(true);
  };

  return (
    <Image
      src={imageError ? placeholderUrl : unsplashUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      unoptimized // Unsplash URLs are external and dynamic
    />
  );
}
