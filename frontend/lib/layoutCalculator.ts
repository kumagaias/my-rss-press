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
 * Priority for lead article:
 * 1. Articles with images are prioritized for lead position
 * 2. Among articles with images, highest importance wins
 * 3. If no images, highest importance wins
 * 
 * Top stories and remaining articles follow normal importance order.
 * 
 * @param articles - Array of articles with importance scores
 * @returns Layout grid with categorized articles
 */
export function calculateLayout(articles: Article[]): LayoutGrid {
  if (articles.length === 0) {
    throw new Error('Cannot calculate layout for empty article list');
  }

  // Sort all articles by importance (descending)
  const sortedByImportance = [...articles].sort((a, b) => b.importance - a.importance);

  // Find the best lead article (prioritize images)
  const articlesWithImages = sortedByImportance.filter(a => a.imageUrl);
  const lead = articlesWithImages.length > 0 
    ? articlesWithImages[0]  // Highest importance article with image
    : sortedByImportance[0];  // Highest importance article overall

  // Remove lead from sorted list to get remaining articles
  const remainingArticles = sortedByImportance.filter(a => a !== lead);
  const totalArticles = articles.length;

  // Layout logic based on article count
  if (totalArticles <= 4) {
    // Few articles (1-4): Display all prominently
    return {
      lead,
      topStories: remainingArticles,
      remaining: [],
    };
  } else if (totalArticles <= 8) {
    // Medium article count (5-8): Lead + 3 top stories + remaining
    return {
      lead,
      topStories: remainingArticles.slice(0, 3),
      remaining: remainingArticles.slice(3),
    };
  } else {
    // Many articles (9+): Lead + 4 top stories + remaining
    return {
      lead,
      topStories: remainingArticles.slice(0, 4),
      remaining: remainingArticles.slice(4),
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
