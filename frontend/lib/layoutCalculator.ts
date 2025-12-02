import { Article } from '@/types';

/**
 * Layout structure for newspaper articles
 */
export interface LayoutGrid {
  lead: Article;
  topStories: Article[];
  remaining: Article[];
}

/**
 * Calculate dynamic layout based on article count
 * 
 * Layout rules:
 * - 1-4 articles: All displayed large
 * - 5-8 articles: Lead (1) + Top Stories (3) + Remaining
 * - 9+ articles: Lead (1) + Top Stories (4) + Remaining
 * 
 * @param articles - Array of articles with importance scores
 * @returns Layout grid with categorized articles
 */
export function calculateLayout(articles: Article[]): LayoutGrid {
  if (articles.length === 0) {
    throw new Error('Cannot calculate layout for empty article list');
  }

  // Sort articles by importance (descending)
  const sorted = [...articles].sort((a, b) => b.importance - a.importance);
  const totalArticles = sorted.length;

  // Layout logic based on article count
  if (totalArticles <= 4) {
    // Few articles (1-4): Display all prominently
    return {
      lead: sorted[0],
      topStories: sorted.slice(1),
      remaining: [],
    };
  } else if (totalArticles <= 8) {
    // Medium article count (5-8): Lead + 3 top stories + remaining
    return {
      lead: sorted[0],
      topStories: sorted.slice(1, 4),
      remaining: sorted.slice(4),
    };
  } else {
    // Many articles (9+): Lead + 4 top stories + remaining
    return {
      lead: sorted[0],
      topStories: sorted.slice(1, 5),
      remaining: sorted.slice(5),
    };
  }
}

/**
 * Validate that all articles are included in the layout
 * 
 * @param articles - Original article array
 * @param layout - Calculated layout
 * @returns true if all articles are included
 */
export function validateLayout(articles: Article[], layout: LayoutGrid): boolean {
  const layoutArticles = [layout.lead, ...layout.topStories, ...layout.remaining];
  return layoutArticles.length === articles.length;
}
