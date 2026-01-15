/**
 * Book Recommendation Service
 * 
 * Generates book recommendations based on newspaper theme and editorial content.
 * Uses Google Books API to find relevant books.
 */

import { searchBooks } from './googleBooksClient.js';

/**
 * Minimal article shape used for book recommendations.
 * Only requires title for keyword extraction.
 */
export interface ArticleForRecommendation {
  title: string;
  description?: string;
}

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
const TOP_ARTICLES_COUNT = 5; // Number of top articles to extract keywords from
const EDITORIAL_KEYWORD_COUNT = 2; // Maximum keywords from editorial content
const ARTICLE_KEYWORD_COUNT = 3; // Maximum keywords from article titles

/**
 * Generate book recommendations based on theme, editorial content, and articles
 * 
 * @param theme - Newspaper theme (e.g., "Technology", "テクノロジー")
 * @param editorialContent - Editorial column content
 * @param articles - Newspaper articles for additional context
 * @param language - Language code ('en' or 'ja')
 * @returns Array of 2 book recommendations, or empty array on error
 */
export async function generateBookRecommendations(
  theme: string,
  editorialContent: string,
  articles: ArticleForRecommendation[],
  language: 'en' | 'ja'
): Promise<BookRecommendation[]> {
  try {
    // Create timeout promise
    const timeoutPromise = new Promise<BookRecommendation[]>((resolve) => {
      setTimeout(() => resolve([]), TIMEOUT_MS);
    });

    // Create recommendation promise
    const recommendationPromise = generateRecommendationsInternal(theme, editorialContent, articles, language);

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
  articles: ArticleForRecommendation[],
  language: 'en' | 'ja'
): Promise<BookRecommendation[]> {
  // Extract keywords from theme, editorial, and articles
  const keywords = extractKeywords(theme, editorialContent, articles, language);
  
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
 * Extract keywords from theme, editorial content, and articles
 * 
 * @param theme - Newspaper theme
 * @param editorialContent - Editorial column content
 * @param articles - Newspaper articles
 * @param language - Language code
 * @returns Array of keywords
 */
export function extractKeywords(
  theme: string,
  editorialContent: string,
  articles: ArticleForRecommendation[],
  language: 'en' | 'ja'
): string[] {
  const keywords: string[] = [];

  // Add theme as primary keyword
  if (theme && theme.trim().length > 0) {
    keywords.push(theme.trim());
  }

  // Extract keywords from editorial content (up to 2)
  if (editorialContent && editorialContent.trim().length > 0) {
    const editorialKeywords = extractWordsFromText(editorialContent, language, EDITORIAL_KEYWORD_COUNT);
    keywords.push(...editorialKeywords);
  }

  // Extract keywords from article titles (up to 3 from top articles)
  if (articles && articles.length > 0) {
    const topArticles = articles.slice(0, TOP_ARTICLES_COUNT);
    const articleTitles = topArticles
      .filter(a => a && a.title)
      .map(a => a.title)
      .join(' ');
    const articleKeywords = extractWordsFromText(articleTitles, language, ARTICLE_KEYWORD_COUNT);
    keywords.push(...articleKeywords);
  }

  // Remove duplicates and return
  return Array.from(new Set(keywords));
}

/**
 * Extract meaningful words from text
 * 
 * @param text - Text to extract words from
 * @param language - Language code
 * @param maxCount - Maximum number of words to extract
 * @returns Array of extracted words
 */
function extractWordsFromText(
  text: string,
  language: 'en' | 'ja',
  maxCount: number
): string[] {
  // For Japanese, extract words with 2+ characters (simplified keyword extraction)
  // For English, extract capitalized words or words with 5+ characters
  const words = text.split(/\s+/);
  
  const extractedWords = words
    .filter((word) => {
      const cleaned = word.replace(/[^\p{L}\p{N}]/gu, '');
      if (language === 'ja') {
        // Japanese: words with 2+ characters
        return cleaned.length >= 2;
      } else {
        // English: capitalized words or words 5+ chars
        return cleaned.length >= 5 || /^[A-Z]/.test(cleaned);
      }
    })
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .slice(0, maxCount);

  return extractedWords;
}
