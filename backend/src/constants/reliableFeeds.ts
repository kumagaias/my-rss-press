/**
 * Reliable RSS Feeds by Category
 * 
 * This file maintains a curated list of reliable RSS feeds organized by category.
 * These feeds are used to improve the quality of AI-powered feed suggestions.
 * 
 * Categories are defined for both English and Japanese content.
 * Japanese categories use the "-jp" suffix.
 */

export interface ReliableFeed {
  url: string;
  title: string;
  description: string;
  language: 'en' | 'ja';
}

export interface ReliableFeedsByCategory {
  [category: string]: ReliableFeed[];
}

/**
 * Reliable feeds organized by category
 */
export const RELIABLE_FEEDS_BY_CATEGORY: ReliableFeedsByCategory = {
  // English Categories
  technology: [
    {
      url: 'https://feeds.arstechnica.com/arstechnica/index',
      title: 'Ars Technica',
      description: 'Technology news and analysis',
      language: 'en',
    },
    {
      url: 'https://www.wired.com/feed/rss',
      title: 'WIRED',
      description: 'Technology, science, and culture',
      language: 'en',
    },
    {
      url: 'https://www.theverge.com/rss/index.xml',
      title: 'The Verge',
      description: 'Technology and digital culture',
      language: 'en',
    },
    {
      url: 'https://techcrunch.com/feed/',
      title: 'TechCrunch',
      description: 'Startup and technology news',
      language: 'en',
    },
  ],

  business: [
    {
      url: 'https://feeds.bloomberg.com/markets/news.rss',
      title: 'Bloomberg Markets',
      description: 'Financial markets and business news',
      language: 'en',
    },
    {
      url: 'https://www.ft.com/?format=rss',
      title: 'Financial Times',
      description: 'Global business and financial news',
      language: 'en',
    },
    {
      url: 'https://www.economist.com/rss',
      title: 'The Economist',
      description: 'International business and politics',
      language: 'en',
    },
  ],

  science: [
    {
      url: 'https://www.nature.com/nature.rss',
      title: 'Nature',
      description: 'Scientific research and news',
      language: 'en',
    },
    {
      url: 'https://www.sciencedaily.com/rss/all.xml',
      title: 'Science Daily',
      description: 'Latest science news',
      language: 'en',
    },
    {
      url: 'https://www.newscientist.com/feed/home',
      title: 'New Scientist',
      description: 'Science and technology news',
      language: 'en',
    },
  ],

  sports: [
    {
      url: 'https://www.espn.com/espn/rss/news',
      title: 'ESPN',
      description: 'Sports news and updates',
      language: 'en',
    },
    {
      url: 'https://www.bbc.co.uk/sport/rss.xml',
      title: 'BBC Sport',
      description: 'International sports coverage',
      language: 'en',
    },
    {
      url: 'https://www.theguardian.com/sport/rss',
      title: 'The Guardian Sport',
      description: 'Sports news and analysis',
      language: 'en',
    },
  ],

  entertainment: [
    {
      url: 'https://variety.com/feed/',
      title: 'Variety',
      description: 'Entertainment industry news',
      language: 'en',
    },
    {
      url: 'https://www.hollywoodreporter.com/feed/',
      title: 'The Hollywood Reporter',
      description: 'Film and TV industry news',
      language: 'en',
    },
    {
      url: 'https://deadline.com/feed/',
      title: 'Deadline',
      description: 'Entertainment news and analysis',
      language: 'en',
    },
  ],

  // Japanese Categories
  'technology-jp': [
    {
      url: 'https://www.itmedia.co.jp/rss/2.0/news_bursts.xml',
      title: 'ITmedia NEWS',
      description: 'テクノロジーとビジネスの情報',
      language: 'ja',
    },
    {
      url: 'https://japan.cnet.com/rss/index.rdf',
      title: 'CNET Japan',
      description: 'テクノロジーニュース',
      language: 'ja',
    },
    {
      url: 'https://www.gizmodo.jp/index.xml',
      title: 'ギズモード・ジャパン',
      description: 'テクノロジーとガジェット',
      language: 'ja',
    },
  ],

  'business-jp': [
    {
      url: 'https://www.nikkei.com/rss/',
      title: '日本経済新聞',
      description: 'ビジネスと経済のニュース',
      language: 'ja',
    },
    {
      url: 'https://diamond.jp/list/feed/rss',
      title: 'ダイヤモンド・オンライン',
      description: 'ビジネス情報',
      language: 'ja',
    },
    {
      url: 'https://toyokeizai.net/list/feed/rss',
      title: '東洋経済オンライン',
      description: '経済とビジネスの情報',
      language: 'ja',
    },
  ],

  'entertainment-jp': [
    {
      url: 'https://www.cinematoday.jp/rss/news',
      title: 'シネマトゥデイ',
      description: '映画ニュース',
      language: 'ja',
    },
    {
      url: 'https://natalie.mu/music/feed/news',
      title: '音楽ナタリー',
      description: '音楽ニュース',
      language: 'ja',
    },
    {
      url: 'https://natalie.mu/eiga/feed/news',
      title: '映画ナタリー',
      description: '映画ニュース',
      language: 'ja',
    },
  ],

  'sports-jp': [
    {
      url: 'https://www.nikkansports.com/rss/index.rdf',
      title: '日刊スポーツ',
      description: 'スポーツニュース',
      language: 'ja',
    },
    {
      url: 'https://www.sponichi.co.jp/rss/index.rdf',
      title: 'スポーツニッポン',
      description: 'スポーツ情報',
      language: 'ja',
    },
    {
      url: 'https://sports.yahoo.co.jp/rss/all-hl.xml',
      title: 'Yahoo!スポーツ',
      description: 'スポーツ速報',
      language: 'ja',
    },
  ],

  'general-jp': [
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
  ],
};

/**
 * Theme to category mapping keywords
 * Used to infer category from user's theme input
 */
const THEME_CATEGORY_KEYWORDS: { [key: string]: string[] } = {
  // Entertainment first to avoid 'tech' matching in 'entertainment'
  entertainment: ['entertainment', 'movie', 'film', 'music', 'tv', 'celebrity', 'hollywood'],
  'entertainment-jp': ['エンタメ', '映画', '音楽', 'テレビ', '芸能', 'セレブ'],
  
  technology: ['tech', 'technology', 'software', 'hardware', 'ai', 'programming', 'coding', 'computer', 'gadget', 'startup'],
  'technology-jp': ['テクノロジー', 'テック', 'ソフトウェア', 'ハードウェア', 'プログラミング', 'コーディング', 'AI', 'ガジェット', 'スタートアップ'],
  
  business: ['business', 'finance', 'economy', 'market', 'stock', 'investment', 'entrepreneur'],
  'business-jp': ['ビジネス', '経済', '金融', '市場', '株', '投資', '起業'],
  
  science: ['science', 'research', 'biology', 'physics', 'chemistry', 'space', 'astronomy'],
  'science-jp': ['科学', '研究', '生物学', '物理学', '化学', '宇宙', '天文学'],
  
  sports: ['sports', 'football', 'soccer', 'basketball', 'baseball', 'tennis', 'olympics'],
  'sports-jp': ['スポーツ', 'サッカー', '野球', 'バスケ', 'テニス', 'オリンピック'],
  
  'general-jp': ['ニュース', '一般', '総合'],
};

/**
 * Get category from theme using keyword matching
 * @param theme - User's theme input
 * @param locale - User's language preference
 * @returns Category name or null if no match found
 */
export function getCategoryFromTheme(theme: string, locale: 'en' | 'ja' = 'en'): string | null {
  const normalizedTheme = theme.toLowerCase().trim();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(THEME_CATEGORY_KEYWORDS)) {
    // Skip categories that don't match the locale
    if (locale === 'ja' && !category.endsWith('-jp') && category !== 'general-jp') {
      continue;
    }
    if (locale === 'en' && category.endsWith('-jp')) {
      continue;
    }
    
    // Check if theme contains any of the category keywords
    for (const keyword of keywords) {
      if (normalizedTheme.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  
  return null;
}

/**
 * Get reliable feeds for a specific category
 * @param category - Category name
 * @returns Array of reliable feeds or empty array if category not found
 */
export function getReliableFeedsByCategory(category: string): ReliableFeed[] {
  return RELIABLE_FEEDS_BY_CATEGORY[category] || [];
}

/**
 * Get all categories for a locale
 * @param locale - User's language preference
 * @returns Array of category names
 */
export function getCategoriesForLocale(locale: 'en' | 'ja' = 'en'): string[] {
  return Object.keys(RELIABLE_FEEDS_BY_CATEGORY).filter(category => {
    if (locale === 'ja') {
      return category.endsWith('-jp') || category === 'general-jp';
    } else {
      return !category.endsWith('-jp');
    }
  });
}
