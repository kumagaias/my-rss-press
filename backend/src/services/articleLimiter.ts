import { Article } from './rssFetcherService';

/**
 * Maximum number of articles to include from each default feed
 * This ensures theme-relevant articles from AI-suggested feeds are prioritized
 */
const MAX_DEFAULT_ARTICLES_PER_FEED = 2;

/**
 * Minimum total article count to maintain for newspaper generation
 */
const MIN_ARTICLE_COUNT = 8;

/**
 * Feed metadata interface for tracking default feeds
 */
export interface FeedMetadata {
  url: string;
  title?: string;
  isDefault: boolean;
}

/**
 * Limit articles from default feeds while maintaining minimum article count
 * 
 * This function prioritizes articles from AI-suggested feeds over default feeds
 * by limiting the number of articles from each default feed. It ensures that
 * the total article count meets the minimum requirement.
 * 
 * @param articles - Array of articles from all feeds
 * @param feedMetadata - Array of feed metadata with default flags
 * @returns Filtered array of articles with default feed limits applied
 */
export function limitDefaultFeedArticles(
  articles: Article[],
  feedMetadata: FeedMetadata[]
): Article[] {
  // Group articles by feed source
  const articlesByFeed = new Map<string, Article[]>();
  for (const article of articles) {
    const feedArticles = articlesByFeed.get(article.feedSource) || [];
    feedArticles.push(article);
    articlesByFeed.set(article.feedSource, feedArticles);
  }

  // Separate default and non-default feed articles
  const nonDefaultArticles: Article[] = [];
  const defaultArticles: Article[] = [];

  for (const [feedUrl, feedArticles] of articlesByFeed) {
    const feedMeta = feedMetadata.find(f => f.url === feedUrl);
    const isDefault = feedMeta?.isDefault || false;

    if (isDefault) {
      // Limit default feed articles to MAX_DEFAULT_ARTICLES_PER_FEED
      defaultArticles.push(...feedArticles.slice(0, MAX_DEFAULT_ARTICLES_PER_FEED));
    } else {
      // Include all articles from non-default feeds
      nonDefaultArticles.push(...feedArticles);
    }
  }

  // Combine non-default and limited default articles
  const limitedArticles = [...nonDefaultArticles, ...defaultArticles];

  // If we don't have enough articles, add more from default feeds
  if (limitedArticles.length < MIN_ARTICLE_COUNT) {
    const additionalNeeded = MIN_ARTICLE_COUNT - limitedArticles.length;
    
    // Get all default articles that weren't included yet
    const allDefaultArticles: Article[] = [];
    for (const [feedUrl, feedArticles] of articlesByFeed) {
      const feedMeta = feedMetadata.find(f => f.url === feedUrl);
      const isDefault = feedMeta?.isDefault || false;
      
      if (isDefault) {
        // Add articles beyond the initial limit
        allDefaultArticles.push(...feedArticles.slice(MAX_DEFAULT_ARTICLES_PER_FEED));
      }
    }

    // Add additional articles to meet minimum count
    limitedArticles.push(...allDefaultArticles.slice(0, additionalNeeded));
  }

  console.log(`Article limiter: ${articles.length} total → ${limitedArticles.length} after limiting (${nonDefaultArticles.length} non-default, ${limitedArticles.length - nonDefaultArticles.length} default)`);

  return limitedArticles;
}

/**
 * Count articles by feed source for debugging
 * 
 * @param articles - Array of articles
 * @returns Map of feed URL to article count
 */
export function countArticlesByFeed(articles: Article[]): Map<string, number> {
  const counts = new Map<string, number>();
  
  for (const article of articles) {
    const count = counts.get(article.feedSource) || 0;
    counts.set(article.feedSource, count + 1);
  }
  
  return counts;
}
