/**
 * Book Recommendation Service
 * 
 * Generates book recommendations based on newspaper theme and editorial content.
 * Uses Google Books API to find relevant books.
 */

import { searchBooks } from './googleBooksClient.js';

export interface BookRecommendation {
  title: string;
  authors: string[];
  description?: string;
  thumbnail?: string;
  infoLink: string;
  contentType: 'book';
}

const TIMEOUT_MS = 5000; // 5 seconds
const BOOK_COUNT = 2;

/**
 * Generate book recommendations based on theme and editorial content
 * 
 * @param theme - Newspaper theme (e.g., "Technology", "テクノロジー")
 * @param editorialContent - Editorial column content
 * @param language - Language code ('en' or 'ja')
 * @returns Array of 2 book recommendations, or empty array on error
 */
export async function generateBookRecommendations(
  theme: string,
  editorialContent: string,
  language: 'en' | 'ja'
): Promise<BookRecommendation[]> {
  try {
    // Create timeout promise
    const timeoutPromise = new Promise<BookRecommendation[]>((resolve) => {
      setTimeout(() => resolve([]), TIMEOUT_MS);
    });

    // Create recommendation promise
    const recommendationPromise = generateRecommendationsInternal(theme, editorialContent, language);

    // Race between timeout and actual recommendation
    const result = await Promise.race([recommendationPromise, timeoutPromise]);
    return result;
  } catch (error) {
    console.error('Error generating book recommendations:', error);
    return [];
  }
}

/**
 * Internal function to generate recommendations
 */
async function generateRecommendationsInternal(
  theme: string,
  editorialContent: string,
  language: 'en' | 'ja'
): Promise<BookRecommendation[]> {
  // Extract keywords from theme and editorial
  const keywords = extractKeywords(theme, editorialContent, language);
  
  if (keywords.length === 0) {
    return [];
  }

  // Search books with combined keywords
  const query = keywords.join(' ');
  const books = await searchBooks({
    query,
    maxResults: 10, // Request more to ensure we get 2 good results
    langRestrict: language,
  });

  // Transform to BookRecommendation format and take first 2
  const recommendations: BookRecommendation[] = books
    .slice(0, BOOK_COUNT)
    .map((book) => ({
      ...book,
      contentType: 'book' as const,
    }));

  return recommendations;
}

/**
 * Extract keywords from theme and editorial content
 * 
 * @param theme - Newspaper theme
 * @param editorialContent - Editorial column content
 * @param language - Language code
 * @returns Array of keywords
 */
export function extractKeywords(
  theme: string,
  editorialContent: string,
  language: 'en' | 'ja'
): string[] {
  const keywords: string[] = [];

  // Add theme as primary keyword
  if (theme && theme.trim().length > 0) {
    keywords.push(theme.trim());
  }

  // Extract additional keywords from editorial content
  if (editorialContent && editorialContent.trim().length > 0) {
    // For Japanese, extract nouns (simplified approach: words 2+ chars)
    // For English, extract capitalized words and longer words
    const words = editorialContent.split(/\s+/);
    
    const additionalKeywords = words
      .filter((word) => {
        const cleaned = word.replace(/[^\p{L}\p{N}]/gu, '');
        if (language === 'ja') {
          // Japanese: words with 2+ characters
          return cleaned.length >= 2;
        } else {
          // English: capitalized words or words 5+ chars
          return cleaned.length >= 5 || /^[A-Z]/.test(word);
        }
      })
      .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
      .slice(0, 3); // Take top 3 additional keywords

    keywords.push(...additionalKeywords);
  }

  // Remove duplicates and return
  return Array.from(new Set(keywords));
}
