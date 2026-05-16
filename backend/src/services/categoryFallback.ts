/**
 * Fallback mechanism for category management
 * 
 * Provides fallback to hardcoded default feeds when DynamoDB is unavailable
 */

import { Category, Feed } from '../types/category.js';
import * as categoryService from './categoryService.js';

/**
 * Default feeds for fallback (matches getAllDefaultFeeds in feedSuggestionService)
 * Requirements 4.1: Provide at least 15 feeds
 */
const DEFAULT_FEEDS_EN = [
  {
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    title: 'BBC News',
    description: 'General news and information',
    language: 'en',
  },
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    title: 'The New York Times',
    description: 'In-depth articles and analysis',
    language: 'en',
  },
  {
    url: 'https://feeds.reuters.com/reuters/topNews',
    title: 'Reuters Top News',
    description: 'Breaking news and updates',
    language: 'en',
  },
  {
    url: 'https://www.theguardian.com/world/rss',
    title: 'The Guardian World News',
    description: 'Global perspective',
    language: 'en',
  },
  {
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    title: 'Ars Technica',
    description: 'Technology and science coverage',
    language: 'en',
  },
  {
    url: 'https://www.wired.com/feed/rss',
    title: 'Wired',
    description: 'Technology and innovation news',
    language: 'en',
  },
  {
    url: 'https://techcrunch.com/feed/',
    title: 'TechCrunch',
    description: 'Startup and technology news',
    language: 'en',
  },
  {
    url: 'https://www.theverge.com/rss/index.xml',
    title: 'The Verge',
    description: 'Technology and culture coverage',
    language: 'en',
  },
  {
    url: 'https://www.engadget.com/rss.xml',
    title: 'Engadget',
    description: 'Consumer electronics and technology news',
    language: 'en',
  },
  {
    url: 'https://www.cnet.com/rss/news/',
    title: 'CNET News',
    description: 'Tech news and reviews',
    language: 'en',
  },
  {
    url: 'https://www.zdnet.com/news/rss.xml',
    title: 'ZDNet',
    description: 'Business technology news',
    language: 'en',
  },
  {
    url: 'https://www.forbes.com/real-time/feed2/',
    title: 'Forbes',
    description: 'Business and finance news',
    language: 'en',
  },
  {
    url: 'https://www.bloomberg.com/feed/podcast/etf-report.xml',
    title: 'Bloomberg',
    description: 'Financial and business news',
    language: 'en',
  },
  {
    url: 'https://www.wsj.com/xml/rss/3_7085.xml',
    title: 'Wall Street Journal',
    description: 'Business and financial coverage',
    language: 'en',
  },
  {
    url: 'https://www.economist.com/rss',
    title: 'The Economist',
    description: 'Global economic and political analysis',
    language: 'en',
  },
  {
    url: 'https://news.ycombinator.com/rss',
    title: 'Hacker News',
    description: 'Technology, startups, and engineering discussions',
    language: 'en',
  },
  {
    url: 'https://www.nasa.gov/news-release/feed/',
    title: 'NASA News',
    description: 'Space, science, and exploration news',
    language: 'en',
  },
  {
    url: 'https://www.sciencedaily.com/rss/all.xml',
    title: 'ScienceDaily',
    description: 'Science research and discovery updates',
    language: 'en',
  },
  {
    url: 'https://www.theverge.com/science/rss/index.xml',
    title: 'The Verge Science',
    description: 'Science and technology culture coverage',
    language: 'en',
  },
  {
    url: 'https://www.healthline.com/rss',
    title: 'Healthline',
    description: 'Health and wellness information',
    language: 'en',
  },
  {
    url: 'https://www.producthunt.com/feed',
    title: 'Product Hunt',
    description: 'New products, startups, and maker launches',
    language: 'en',
  },
  {
    url: 'https://feeds.feedburner.com/venturebeat/SZYF',
    title: 'VentureBeat',
    description: 'AI, enterprise technology, and startup coverage',
    language: 'en',
  },
  {
    url: 'https://www.smashingmagazine.com/feed/',
    title: 'Smashing Magazine',
    description: 'Design and frontend development articles',
    language: 'en',
  },
  {
    url: 'https://css-tricks.com/feed/',
    title: 'CSS-Tricks',
    description: 'Frontend engineering and web design',
    language: 'en',
  },
  {
    url: 'https://www.marketingbrew.com/feed',
    title: 'Marketing Brew',
    description: 'Marketing, media, and advertising news',
    language: 'en',
  },
];

const DEFAULT_FEEDS_JA = [
  {
    url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
    title: 'NHK ニュース',
    description: '一般的なニュースと情報',
    language: 'ja',
  },
  {
    url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf',
    title: '朝日新聞デジタル',
    description: '詳細な記事と分析',
    language: 'ja',
  },
  {
    url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
    title: 'Yahoo!ニュース',
    description: '速報とアップデート',
    language: 'ja',
  },
  {
    url: 'https://www.itmedia.co.jp/rss/2.0/news_bursts.xml',
    title: 'ITmedia NEWS',
    description: 'テクノロジーとビジネスの情報',
    language: 'ja',
  },
  {
    url: 'https://www.nikkei.com/rss/',
    title: '日本経済新聞',
    description: '経済とビジネスのニュース',
    language: 'ja',
  },
  {
    url: 'https://mainichi.jp/rss/etc/mainichi-flash.rss',
    title: '毎日新聞',
    description: '総合ニュース',
    language: 'ja',
  },
  {
    url: 'https://www.yomiuri.co.jp/rss/index.xml',
    title: '読売新聞',
    description: '国内外のニュース',
    language: 'ja',
  },
  {
    url: 'https://www.sankei.com/rss/index.xml',
    title: '産経ニュース',
    description: '政治・経済・社会のニュース',
    language: 'ja',
  },
  {
    url: 'https://www.jiji.com/rss/index.rdf',
    title: '時事ドットコム',
    description: '速報ニュース',
    language: 'ja',
  },
  {
    url: 'https://www.kyodo.co.jp/rss/index.xml',
    title: '共同通信',
    description: '国内外のニュース',
    language: 'ja',
  },
  {
    url: 'https://www.tokyo-np.co.jp/rss/',
    title: '東京新聞',
    description: '首都圏のニュース',
    language: 'ja',
  },
  {
    url: 'https://www.nikkansports.com/rss/index.xml',
    title: '日刊スポーツ',
    description: 'スポーツニュース',
    language: 'ja',
  },
  {
    url: 'https://www.sponichi.co.jp/rss/index.xml',
    title: 'スポーツニッポン',
    description: 'スポーツと芸能のニュース',
    language: 'ja',
  },
  {
    url: 'https://www.oricon.co.jp/rss/index.xml',
    title: 'ORICON NEWS',
    description: 'エンタメニュース',
    language: 'ja',
  },
  {
    url: 'https://www.cinematoday.jp/rss/index.xml',
    title: 'シネマトゥデイ',
    description: '映画ニュース',
    language: 'ja',
  },
  {
    url: 'https://b.hatena.ne.jp/hotentry/it.rss',
    title: 'はてなブックマーク IT',
    description: '話題のIT・テクノロジー記事',
    language: 'ja',
  },
  {
    url: 'https://zenn.dev/feed',
    title: 'Zenn',
    description: 'エンジニアリングと開発知見',
    language: 'ja',
  },
  {
    url: 'https://qiita.com/popular-items/feed',
    title: 'Qiita 人気投稿',
    description: '開発者向け技術記事',
    language: 'ja',
  },
  {
    url: 'https://gigazine.net/news/rss_2.0/',
    title: 'GIGAZINE',
    description: 'テクノロジー・科学・カルチャー',
    language: 'ja',
  },
  {
    url: 'https://forest.watch.impress.co.jp/data/rss/1.0/wf/feed.rdf',
    title: '窓の杜',
    description: 'ソフトウェアとPC活用情報',
    language: 'ja',
  },
  {
    url: 'https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf',
    title: 'PC Watch',
    description: 'PC・半導体・デバイス情報',
    language: 'ja',
  },
  {
    url: 'https://k-tai.watch.impress.co.jp/data/rss/1.0/ktw/feed.rdf',
    title: 'ケータイ Watch',
    description: 'モバイルと通信のニュース',
    language: 'ja',
  },
  {
    url: 'https://internet.watch.impress.co.jp/data/rss/1.0/iw/feed.rdf',
    title: 'INTERNET Watch',
    description: 'インターネットとセキュリティ情報',
    language: 'ja',
  },
  {
    url: 'https://www.publickey1.jp/atom.xml',
    title: 'Publickey',
    description: 'クラウド・開発・エンタープライズIT',
    language: 'ja',
  },
  {
    url: 'https://www.lifehacker.jp/feed/index.xml',
    title: 'ライフハッカー・ジャパン',
    description: '仕事術・生産性・暮らしの情報',
    language: 'ja',
  },
];

/**
 * Get category by theme with fallback to constants
 * @param theme - User's theme input
 * @param locale - Locale ('en' or 'ja')
 * @returns Category or null
 */
export async function getCategoryByThemeWithFallback(
  theme: string,
  locale: 'en' | 'ja'
): Promise<Category | null> {
  try {
    return await categoryService.getCategoryByTheme(theme, locale);
  } catch (error) {
    console.error('[Fallback] DynamoDB error in getCategoryByTheme, falling back to null:', error);
    return null;
  }
}

/**
 * Get feeds by category with fallback to default feeds
 * @param categoryId - Category ID
 * @param locale - Locale for fallback
 * @returns Array of feeds
 */
export async function getFeedsByCategoryWithFallback(
  categoryId: string,
  locale: 'en' | 'ja'
): Promise<Feed[]> {
  try {
    const feeds = await categoryService.getFeedsByCategory(categoryId);
    if (feeds.length > 0) {
      return feeds;
    }
    
    // If no feeds found, fall back to defaults
    console.log(`[Fallback] No feeds found for category ${categoryId}, using default feeds`);
    return getDefaultFeedsAsFeeds(locale, categoryId);
  } catch (error) {
    console.error(`[Fallback] DynamoDB error in getFeedsByCategory, using default feeds:`, error);
    return getDefaultFeedsAsFeeds(locale, categoryId);
  }
}

/**
 * Get all default feeds for a locale
 * @param locale - Locale ('en' or 'ja')
 * @returns Array of default feeds
 */
export function getAllDefaultFeeds(locale: 'en' | 'ja'): Array<{
  url: string;
  title: string;
  description: string;
  language: string;
}> {
  return locale === 'ja' ? DEFAULT_FEEDS_JA : DEFAULT_FEEDS_EN;
}

/**
 * Convert default feeds to Feed type
 * @param locale - Locale
 * @param categoryId - Category ID
 * @returns Array of Feed objects
 */
function getDefaultFeedsAsFeeds(locale: 'en' | 'ja', categoryId: string): Feed[] {
  const defaultFeeds = getAllDefaultFeeds(locale);
  const now = new Date().toISOString();
  
  return defaultFeeds.map((feed, index) => ({
    categoryId,
    url: feed.url,
    title: feed.title,
    description: feed.description,
    language: feed.language,
    priority: index + 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }));
}
