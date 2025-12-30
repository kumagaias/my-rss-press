#!/usr/bin/env node
/**
 * Migration script to populate DynamoDB with initial category and feed data
 * 
 * Usage:
 *   npm run migrate:categories           # Run actual migration
 *   npm run migrate:categories -- --dry-run  # Preview without writing
 */

import { createCategory, createFeed, getCategoryById } from '../repositories/categoryRepository.js';
import { Category, Feed } from '../types/category.js';

// Define initial categories and feeds
const INITIAL_DATA = {
  categories: [
    // English categories
    {
      categoryId: 'general-news-en',
      parentCategory: 'news',
      locale: 'en' as const,
      displayName: 'General News',
      keywords: ['news', 'general', 'world', 'current events'],
      order: 1,
      isActive: true,
    },
    {
      categoryId: 'technology-en',
      parentCategory: 'tech',
      locale: 'en' as const,
      displayName: 'Technology',
      keywords: ['tech', 'technology', 'IT', 'software', 'hardware', 'innovation'],
      order: 2,
      isActive: true,
    },
    {
      categoryId: 'business-en',
      parentCategory: 'business',
      locale: 'en' as const,
      displayName: 'Business',
      keywords: ['business', 'finance', 'economy', 'market', 'trade'],
      order: 3,
      isActive: true,
    },
    {
      categoryId: 'sports-en',
      parentCategory: 'sports',
      locale: 'en' as const,
      displayName: 'Sports',
      keywords: ['sports', 'football', 'basketball', 'soccer', 'athletics'],
      order: 4,
      isActive: true,
    },
    
    // Japanese categories
    {
      categoryId: 'general-news-ja',
      parentCategory: 'news',
      locale: 'ja' as const,
      displayName: '一般ニュース',
      keywords: ['ニュース', '一般', '世界', '時事'],
      order: 1,
      isActive: true,
    },
    {
      categoryId: 'technology-ja',
      parentCategory: 'tech',
      locale: 'ja' as const,
      displayName: 'テクノロジー',
      keywords: ['テクノロジー', '技術', 'IT', 'ソフトウェア', 'ハードウェア', 'イノベーション'],
      order: 2,
      isActive: true,
    },
    {
      categoryId: 'business-ja',
      parentCategory: 'business',
      locale: 'ja' as const,
      displayName: 'ビジネス',
      keywords: ['ビジネス', '金融', '経済', '市場', '貿易'],
      order: 3,
      isActive: true,
    },
    {
      categoryId: 'sports-ja',
      parentCategory: 'sports',
      locale: 'ja' as const,
      displayName: 'スポーツ',
      keywords: ['スポーツ', 'サッカー', '野球', 'バスケットボール'],
      order: 4,
      isActive: true,
    },
  ],
  
  feeds: [
    // English feeds
    {
      categoryId: 'general-news-en',
      url: 'https://feeds.bbci.co.uk/news/rss.xml',
      title: 'BBC News',
      description: 'General news and information from BBC',
      language: 'en',
      priority: 1,
      isActive: true,
    },
    {
      categoryId: 'general-news-en',
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
      title: 'The New York Times',
      description: 'In-depth articles and analysis from NYT',
      language: 'en',
      priority: 2,
      isActive: true,
    },
    {
      categoryId: 'general-news-en',
      url: 'https://feeds.reuters.com/reuters/topNews',
      title: 'Reuters Top News',
      description: 'Breaking news and updates from Reuters',
      language: 'en',
      priority: 3,
      isActive: true,
    },
    {
      categoryId: 'general-news-en',
      url: 'https://www.theguardian.com/world/rss',
      title: 'The Guardian World News',
      description: 'Global perspective from The Guardian',
      language: 'en',
      priority: 4,
      isActive: true,
    },
    
    // Japanese feeds
    {
      categoryId: 'general-news-ja',
      url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
      title: 'NHK ニュース',
      description: '一般的なニュースと情報',
      language: 'ja',
      priority: 1,
      isActive: true,
    },
    {
      categoryId: 'general-news-ja',
      url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf',
      title: '朝日新聞デジタル',
      description: '詳細な記事と分析',
      language: 'ja',
      priority: 2,
      isActive: true,
    },
    {
      categoryId: 'general-news-ja',
      url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
      title: 'Yahoo!ニュース',
      description: '速報とアップデート',
      language: 'ja',
      priority: 3,
      isActive: true,
    },
    {
      categoryId: 'technology-ja',
      url: 'https://www.itmedia.co.jp/rss/2.0/news_bursts.xml',
      title: 'ITmedia NEWS',
      description: 'テクノロジーとビジネスの情報',
      language: 'ja',
      priority: 1,
      isActive: true,
    },
  ],
};

/**
 * Main migration function
 */
async function migrate(dryRun: boolean = false): Promise<void> {
  console.log('='.repeat(60));
  console.log('Category Migration Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (preview only)' : 'ACTUAL MIGRATION'}`);
  console.log('');

  // Summary
  console.log('Summary:');
  console.log(`  Categories: ${INITIAL_DATA.categories.length}`);
  console.log(`  Feeds: ${INITIAL_DATA.feeds.length}`);
  console.log('');

  if (dryRun) {
    console.log('Preview of categories to be created:');
    console.log('-'.repeat(60));
    INITIAL_DATA.categories.forEach((cat) => {
      console.log(`  [${cat.locale}] ${cat.categoryId} (${cat.displayName})`);
      console.log(`    Parent: ${cat.parentCategory || 'none'}`);
      console.log(`    Keywords: ${cat.keywords.join(', ')}`);
      console.log(`    Order: ${cat.order}`);
      console.log('');
    });

    console.log('Preview of feeds to be created:');
    console.log('-'.repeat(60));
    INITIAL_DATA.feeds.forEach((feed) => {
      console.log(`  [${feed.categoryId}] ${feed.title}`);
      console.log(`    URL: ${feed.url}`);
      console.log(`    Priority: ${feed.priority}`);
      console.log('');
    });

    console.log('='.repeat(60));
    console.log('DRY RUN COMPLETE - No data was written');
    console.log('Run without --dry-run to perform actual migration');
    console.log('='.repeat(60));
    return;
  }

  // Actual migration
  console.log('Starting migration...');
  console.log('');

  // Migrate categories
  console.log('Migrating categories...');
  let categoryCount = 0;
  let skippedCount = 0;
  for (const categoryData of INITIAL_DATA.categories) {
    try {
      // Check if category already exists
      const existing = await getCategoryById(categoryData.categoryId);
      if (existing) {
        console.log(`  ⏭️  Skipped category: ${categoryData.categoryId} (already exists)`);
        skippedCount++;
        continue;
      }

      const now = new Date().toISOString();
      const category: Category = {
        ...categoryData,
        createdAt: now,
        updatedAt: now,
      };
      
      await createCategory(category);
      categoryCount++;
      console.log(`  ✅ Created category: ${category.categoryId} (${category.displayName})`);
    } catch (error) {
      console.error(`  ❌ Failed to create category ${categoryData.categoryId}:`, error);
    }
  }
  console.log(`Categories migrated: ${categoryCount}/${INITIAL_DATA.categories.length} (${skippedCount} skipped)`);
  console.log('');

  // Migrate feeds
  console.log('Migrating feeds...');
  let feedCount = 0;
  for (const feedData of INITIAL_DATA.feeds) {
    try {
      const now = new Date().toISOString();
      const feed: Feed = {
        ...feedData,
        createdAt: now,
        updatedAt: now,
      };
      
      await createFeed(feed);
      feedCount++;
      console.log(`  ✅ Created feed: ${feed.title} (${feed.categoryId})`);
    } catch (error) {
      console.error(`  ❌ Failed to create feed ${feedData.title}:`, error);
    }
  }
  console.log(`Feeds migrated: ${feedCount}/${INITIAL_DATA.feeds.length}`);
  console.log('');

  console.log('='.repeat(60));
  console.log('MIGRATION COMPLETE');
  console.log(`  Categories: ${categoryCount}/${INITIAL_DATA.categories.length}`);
  console.log(`  Feeds: ${feedCount}/${INITIAL_DATA.feeds.length}`);
  console.log('='.repeat(60));
}

/**
 * Rollback function (marks all migrated items as inactive)
 */
async function rollback(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Category Migration Rollback');
  console.log('='.repeat(60));
  console.log('This will mark all migrated categories and feeds as inactive');
  console.log('');
  
  // Note: Actual rollback implementation would require deleteCategory/deleteFeed
  // For now, this is a placeholder
  console.log('Rollback not yet implemented');
  console.log('To rollback, manually set isActive=false for migrated items');
  console.log('='.repeat(60));
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const isRollback = args.includes('--rollback');

// Run migration
if (isRollback) {
  rollback().catch((error) => {
    console.error('Rollback failed:', error);
    process.exit(1);
  });
} else {
  migrate(dryRun).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}
