import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 5000, // 5 second timeout per feed
});

export interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  imageUrl?: string;
  feedSource: string;
  importance?: number;
}

/**
 * Fetch articles from multiple RSS feeds in parallel
 * @param feedUrls - Array of RSS feed URLs
 * @param daysBack - Number of days to look back (default: 3, fallback to 7)
 * @returns Array of articles
 */
export async function fetchArticles(
  feedUrls: string[],
  daysBack: number = 3
): Promise<Article[]> {
  console.log(`Fetching articles from ${feedUrls.length} feeds (${daysBack} days back)`);

  // Fetch all feeds in parallel
  const feedPromises = feedUrls.map(url => parseFeed(url));
  const feedResults = await Promise.allSettled(feedPromises);

  // Collect all articles from successful feeds
  const allArticles: Article[] = [];
  feedResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    } else {
      console.error(`Failed to fetch feed ${feedUrls[index]}:`, result.reason);
    }
  });

  // Filter by date
  const filteredArticles = filterByDate(allArticles, daysBack);

  console.log(`Fetched ${filteredArticles.length} articles from ${daysBack} days`);

  return filteredArticles;
}

/**
 * Parse a single RSS feed
 * @param url - RSS feed URL
 * @returns Array of articles from the feed
 */
async function parseFeed(url: string): Promise<Article[]> {
  try {
    const feed = await parser.parseURL(url);
    const articles: Article[] = [];

    for (const item of feed.items) {
      // Skip items without required fields
      if (!item.title || !item.link) {
        continue;
      }

      // Extract image URL from various possible locations
      const imageUrl = extractImageUrl(item);

      // Parse publication date
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();

      articles.push({
        title: item.title,
        description: item.contentSnippet || item.content || item.summary || '',
        link: item.link,
        pubDate,
        imageUrl,
        feedSource: url,
      });
    }

    return articles;
  } catch (error) {
    console.error(`Error parsing feed ${url}:`, error);
    throw error;
  }
}

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item: any): string | undefined {
  // Try various common image fields
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url;
  }

  if (item['media:content']?.$ && item['media:content'].$.url) {
    return item['media:content'].$.url;
  }

  if (item['media:thumbnail']?.$ && item['media:thumbnail'].$.url) {
    return item['media:thumbnail'].$.url;
  }

  if (item.image?.url) {
    return item.image.url;
  }

  // Try to extract from content
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }
  }

  return undefined;
}

/**
 * Filter articles by date range
 * @param articles - Array of articles
 * @param daysBack - Number of days to look back
 * @returns Filtered articles
 */
function filterByDate(articles: Article[], daysBack: number): Article[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return articles.filter(article => article.pubDate >= cutoffDate);
}

/**
 * Determine article count with randomness (8-15 articles)
 */
export function determineArticleCount(): number {
  const min = 8;
  const max = 15;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Select and shuffle articles for newspaper generation
 * @param feedUrls - Array of RSS feed URLs
 * @param _theme - User theme (for logging, currently unused)
 * @returns Selected and shuffled articles
 */
export async function fetchArticlesForNewspaper(
  feedUrls: string[],
  _theme: string
): Promise<Article[]> {
  const minArticles = 8;
  const targetCount = determineArticleCount();

  console.log(`Target article count: ${targetCount}`);

  // Step 1: Try to fetch articles from the last 3 days
  let articles = await fetchArticles(feedUrls, 3);

  // Step 2: If not enough articles, extend to 7 days
  if (articles.length < minArticles) {
    console.log(`Only ${articles.length} articles found in 3 days, extending to 7 days`);
    articles = await fetchArticles(feedUrls, 7);
  }

  // Step 3: If still not enough, use all available articles
  if (articles.length < minArticles) {
    console.warn(`Only ${articles.length} articles found (minimum: ${minArticles})`);
  }

  // Sort by publication date (newest first)
  articles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  // Step 4: Select up to target count (prioritize recent articles)
  const selectedArticles = articles.slice(0, Math.min(targetCount, articles.length));

  // Step 5: Shuffle for layout variation
  const shuffled = selectedArticles.sort(() => Math.random() - 0.5);

  console.log(`Selected ${shuffled.length} articles for newspaper`);

  return shuffled;
}
