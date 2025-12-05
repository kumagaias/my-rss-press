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
 * Fisher-Yates shuffle algorithm for true random distribution
 * @param array - Array to shuffle
 * @returns Shuffled array
 */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
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
  let successCount = 0;
  let failCount = 0;
  
  feedResults.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
      successCount++;
      console.log(`✓ Feed ${index + 1}/${feedUrls.length} succeeded: ${feedUrls[index]} (${result.value.length} articles)`);
    } else {
      failCount++;
      console.error(`✗ Feed ${index + 1}/${feedUrls.length} failed: ${feedUrls[index]}`);
      console.error(`  Reason:`, result.reason);
    }
  });
  
  console.log(`Feed fetch summary: ${successCount} succeeded, ${failCount} failed, ${allArticles.length} total articles`);

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
    console.log(`Parsing feed: ${url}`);
    const feed = await parser.parseURL(url);
    console.log(`Feed parsed successfully: ${url}, items: ${feed.items?.length || 0}`);
    
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

    console.log(`Extracted ${articles.length} articles from ${url}`);
    return articles;
  } catch (error) {
    console.error(`Error parsing feed ${url}:`, error);
    if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
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

  // Step 5: Prioritize articles with images for lead story
  // Separate articles with and without images
  const articlesWithImages = selectedArticles.filter(article => article.imageUrl);
  const articlesWithoutImages = selectedArticles.filter(article => !article.imageUrl);

  console.log(`Articles with images: ${articlesWithImages.length}, without images: ${articlesWithoutImages.length}`);

  // Shuffle each group separately using Fisher-Yates algorithm
  const shuffledWithImages = shuffle(articlesWithImages);
  const shuffledWithoutImages = shuffle(articlesWithoutImages);

  // Combine: images first (for lead story), then others
  const shuffled = [...shuffledWithImages, ...shuffledWithoutImages];

  console.log(`Selected ${shuffled.length} articles for newspaper (lead story has image: ${shuffled[0]?.imageUrl ? 'yes' : 'no'})`);

  return shuffled;
}
