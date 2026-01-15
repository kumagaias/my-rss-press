'use client';

/**
 * BookCard Component
 * 
 * Displays a single book recommendation with cover image, title, authors, and description.
 * Entire card is clickable and opens Google Books in a new tab.
 */

import Image from 'next/image';

export interface BookCardProps {
  title: string;
  authors: string[];
  description?: string;
  thumbnail?: string;
  infoLink: string;
  viewOnGoogleBooksLabel: string;
}

export function BookCard({
  title,
  authors,
  description,
  thumbnail,
  infoLink,
  viewOnGoogleBooksLabel,
}: BookCardProps) {
  // Truncate description to ~150 characters
  const truncatedDescription = description
    ? description.length > 150
      ? description.substring(0, 150) + '...'
      : description
    : '';

  return (
    <a
      href={infoLink}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-gray-300 bg-white hover:bg-gray-50 transition-colors min-h-[44px]"
      aria-label={`${title} - ${viewOnGoogleBooksLabel}`}
    >
      <div className="p-4 flex gap-4">
        {/* Book cover */}
        <div className="flex-shrink-0 w-20 h-28 relative bg-gray-100">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={`${title} cover`}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Book info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-bold mb-1 line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            {authors.join(', ')}
          </p>
          {truncatedDescription && (
            <p className="text-sm text-gray-700 line-clamp-3">
              {truncatedDescription}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}
