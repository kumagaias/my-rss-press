'use client';

/**
 * BookRecommendations Component
 * 
 * Displays a section with 2 book recommendations below the editorial column.
 * Responsive layout: 2 columns on desktop, 1 column on mobile.
 */

import { BookCard } from './BookCard';

export interface BookRecommendation {
  title: string;
  authors: string[];
  description?: string;
  thumbnail?: string;
  infoLink: string;
  contentType: 'book';
}

export interface BookRecommendationsProps {
  books: BookRecommendation[];
  sectionTitle: string;
  viewOnGoogleBooksLabel: string;
}

export function BookRecommendations({
  books,
  sectionTitle,
  viewOnGoogleBooksLabel,
}: BookRecommendationsProps) {
  // Don't render if no books
  if (!books || books.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border-t-2 border-gray-800 pt-6">
      {/* Section header */}
      <h2 className="font-serif text-2xl font-bold mb-4 text-center">
        {sectionTitle}
      </h2>

      {/* Book grid - 2 columns on desktop, 1 column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {books.map((book, index) => (
          <BookCard
            key={`${book.infoLink}-${index}`}
            title={book.title}
            authors={book.authors}
            description={book.description}
            thumbnail={book.thumbnail}
            infoLink={book.infoLink}
            viewOnGoogleBooksLabel={viewOnGoogleBooksLabel}
          />
        ))}
      </div>
    </section>
  );
}
