#!/usr/bin/env node
/**
 * RSS Feed Collection Script
 * 
 * Automatically generates newspapers for predefined topic keywords to collect RSS feeds.
 * The newspapers are NOT saved - this script only collects feed information for the RSS Database.
 * 
 * Usage:
 *   npm run collect:rss              # Run with default settings (20s interval, all keywords)
 *   npm run collect:rss -- --interval 30  # Custom interval (seconds)
 *   npm run collect:rss -- --limit 10     # Limit to first N keywords
 *   npm run collect:rss -- --locale en    # Specify locale (en or ja)
 */

import { suggestFeeds } from '../services/feedSuggestionService.js';
import { fetchArticlesForNewspaper } from '../services/rssFetcherService.js';
import { getCategoryByTheme } from '../services/categoryService.js';
import { recordFeedUsage } from '../services/feedUsageService.js';
import { promoteFeedsIfQualified } from '../services/feedLearningService.js';

// Topic keywords (same as frontend/lib/i18n.ts)
const TOPIC_KEYWORDS_EN = [
  'Technology', 'Sports', 'Business', 'Politics', 'Entertainment',
  'Science', 'Health', 'Travel', 'Food', 'Fashion',
  'Music', 'Movies', 'Books', 'Gaming', 'Art',
  'Photography', 'Design', 'Education', 'Finance', 'Real Estate',
  'Automotive', 'Environment', 'Space', 'AI', 'Cryptocurrency',
  'Startups', 'Marketing', 'Programming', 'Fitness', 'Yoga',
  'Cooking', 'Wine', 'Coffee', 'Tea', 'Pets',
  'Gardening', 'DIY', 'Home Decor', 'Parenting', 'Relationships',
  'Psychology', 'Philosophy', 'History', 'Geography', 'Culture',
  'Language', 'Religion', 'Spirituality', 'Meditation', 'Wellness',
];

const TOPIC_KEYWORDS_JA = [
  'テクノロジー', 'スポーツ', 'ビジネス', '政治', 'エンタメ',
  '科学', '健康', '旅行', '料理', 'ファッション',
  '音楽', '映画', '読書', 'ゲーム', 'アート',
  '写真', 'デザイン', '教育', '金融', '不動産',
  '自動車', '環境', '宇宙', 'AI', '暗号通貨',
  'スタートアップ', 'マーケティング', 'プログラミング', 'フィットネス', 'ヨガ',
  '料理', 'ワイン', 'コーヒー', 'お茶', 'ペット',
  'ガーデニング', 'DIY', 'インテリア', '子育て', '人間関係',
  '心理学', '哲学', '歴史', '地理', '文化',
  '言語', '宗教', 'スピリチュアル', '瞑想', 'ウェルネス',
];

interface CollectionStats {
  totalKeywords: number;
  processedKeywords: number;
  successfulCollections: number;
  failedCollections: number;
  totalFeedsCollected: number;
  totalFeedsPromoted: number;
  startTime: Date;
  errors: Array<{ keyword: string; error: string }>;
}

interface CollectionOptions {
  interval: number; // seconds between collections
  limit?: number; // limit number of keywords to process
  locale: 'en' | 'ja';
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Collect RSS feeds for a single keyword
 */
async function collectForKeyword(
  keyword: string,
  locale: 'en' | 'ja',
  stats: CollectionStats
): Promise<void> {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${new Date().toISOString()}] Processing: "${keyword}" (${locale})`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Step 1: Get feed suggestions
    console.log('  [1/4] Getting feed suggestions...');
    const feedSuggestions = await suggestFeeds(keyword, locale);
    const feedUrls = feedSuggestions.feeds.map(f => f.url);
    console.log(`  ✅ Got ${feedUrls.length} feed suggestions`);

    if (feedUrls.length === 0) {
      console.log('  ⚠️  No feeds suggested, skipping...');
      stats.failedCollections++;
      return;
    }

    // Step 2: Fetch articles from feeds
    console.log('  [2/4] Fetching articles from feeds...');
    const { articles, feedLanguages, feedTitles } = await fetchArticlesForNewspaper(
      feedUrls,
      keyword
    );
    console.log(`  ✅ Fetched ${articles.length} articles from ${feedUrls.length} feeds`);

    if (articles.length === 0) {
      console.log('  ⚠️  No articles fetched, skipping...');
      stats.failedCollections++;
      return;
    }

    // Step 3: Get category for the theme
    console.log('  [3/4] Finding category for theme...');
    const category = await getCategoryByTheme(keyword, locale);
    
    if (!category) {
      console.log(`  ⚠️  No category found for theme: ${keyword}, skipping...`);
      stats.failedCollections++;
      return;
    }
    
    console.log(`  ✅ Found category: ${category.displayName} (${category.categoryId})`);

    // Step 4: Record feed usage and promote qualified feeds
    console.log('  [4/4] Recording feed usage and promoting feeds...');
    
    // Count articles per feed
    const feedArticleCounts = new Map<string, number>();
    for (const article of articles) {
      const count = feedArticleCounts.get(article.feedSource) || 0;
      feedArticleCounts.set(article.feedSource, count + 1);
    }

    // Record usage for each feed
    const recordPromises = feedUrls.map(async (url) => {
      const articleCount = feedArticleCounts.get(url) || 0;
      const success = articleCount > 0;
      const title = feedTitles.get(url) || url.split('/')[2] || url;
      
      await recordFeedUsage({
        url,
        categoryId: category.categoryId,
        title,
        articleCount,
        success,
      });
    });
    
    await Promise.all(recordPromises);
    console.log(`  ✅ Recorded usage for ${feedUrls.length} feeds`);

    // Promote qualified feeds
    const promotedCount = await promoteFeedsIfQualified(
      feedUrls,
      category.categoryId,
      feedTitles,
      feedLanguages
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (promotedCount > 0) {
      console.log(`  🎓 Promoted ${promotedCount} new feeds to RSS Database!`);
      stats.totalFeedsPromoted += promotedCount;
    } else {
      console.log(`  ℹ️  No new feeds promoted (may already exist in database)`);
    }

    stats.successfulCollections++;
    stats.totalFeedsCollected += feedUrls.length;
    
    console.log(`  ✅ Completed in ${duration}s`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ Error: ${errorMessage}`);
    stats.failedCollections++;
    stats.errors.push({ keyword, error: errorMessage });
  }
}

/**
 * Main collection function
 */
async function collect(options: CollectionOptions): Promise<void> {
  const keywords = options.locale === 'ja' ? TOPIC_KEYWORDS_JA : TOPIC_KEYWORDS_EN;
  const keywordsToProcess = options.limit ? keywords.slice(0, options.limit) : keywords;

  const stats: CollectionStats = {
    totalKeywords: keywordsToProcess.length,
    processedKeywords: 0,
    successfulCollections: 0,
    failedCollections: 0,
    totalFeedsCollected: 0,
    totalFeedsPromoted: 0,
    startTime: new Date(),
    errors: [],
  };

  console.log('\n' + '='.repeat(60));
  console.log('RSS Feed Collection Script');
  console.log('='.repeat(60));
  console.log(`Locale: ${options.locale}`);
  console.log(`Keywords to process: ${stats.totalKeywords}`);
  console.log(`Interval: ${options.interval} seconds`);
  console.log(`Start time: ${stats.startTime.toISOString()}`);
  console.log('='.repeat(60));
  console.log('\n⚠️  NOTE: Newspapers will NOT be saved - only collecting RSS feeds\n');

  // Process each keyword
  for (let i = 0; i < keywordsToProcess.length; i++) {
    const keyword = keywordsToProcess[i];
    stats.processedKeywords++;

    console.log(`\n📊 Progress: ${stats.processedKeywords}/${stats.totalKeywords} keywords`);
    
    await collectForKeyword(keyword, options.locale, stats);

    // Wait before next keyword (except for the last one)
    if (i < keywordsToProcess.length - 1) {
      console.log(`\n⏳ Waiting ${options.interval} seconds before next keyword...`);
      await sleep(options.interval * 1000);
    }
  }

  // Print final summary
  const totalDuration = ((Date.now() - stats.startTime.getTime()) / 1000).toFixed(2);
  const avgDuration = (parseFloat(totalDuration) / stats.totalKeywords).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('COLLECTION COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total keywords processed: ${stats.processedKeywords}/${stats.totalKeywords}`);
  console.log(`Successful collections: ${stats.successfulCollections}`);
  console.log(`Failed collections: ${stats.failedCollections}`);
  console.log(`Total feeds collected: ${stats.totalFeedsCollected}`);
  console.log(`Total feeds promoted to database: ${stats.totalFeedsPromoted}`);
  console.log(`Total duration: ${totalDuration}s`);
  console.log(`Average per keyword: ${avgDuration}s`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    stats.errors.forEach(({ keyword, error }) => {
      console.log(`  - ${keyword}: ${error}`);
    });
  }

  console.log('\n✅ Collection script finished successfully!\n');
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: CollectionOptions = {
  interval: 20, // default 20 seconds
  locale: 'en', // default English
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--interval' && args[i + 1]) {
    options.interval = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--limit' && args[i + 1]) {
    options.limit = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--locale' && args[i + 1]) {
    const locale = args[i + 1];
    if (locale === 'en' || locale === 'ja') {
      options.locale = locale;
    } else {
      console.error(`Invalid locale: ${locale}. Must be 'en' or 'ja'`);
      process.exit(1);
    }
    i++;
  }
}

// Validate options
if (isNaN(options.interval) || options.interval < 1) {
  console.error('Invalid interval. Must be a positive number.');
  process.exit(1);
}

if (options.limit !== undefined && (isNaN(options.limit) || options.limit < 1)) {
  console.error('Invalid limit. Must be a positive number.');
  process.exit(1);
}

// Run collection
collect(options).catch((error) => {
  console.error('\n❌ Collection script failed:', error);
  process.exit(1);
});
