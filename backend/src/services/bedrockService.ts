import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';

// Bedrock client configuration
const bedrockClient = new BedrockRuntimeClient({
  region: config.bedrockRegion,
});

// Cache for local development (cost reduction)
const cache = new Map<string, FeedSuggestion[]>();

export interface FeedSuggestion {
  url: string;
  title: string;
  reasoning: string;
  isDefault?: boolean; // Flag to indicate if this is a default/fallback feed
}

/**
 * Validate if a feed URL is accessible
 */
async function validateFeedUrl(url: string): Promise<boolean> {
  try {
    // Use a more common User-Agent to avoid blocking
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    // Try HEAD request first
    const headResponse = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(5000),
    });
    
    if (headResponse.ok) {
      console.log(`[Validation] HEAD request succeeded for ${url} (${headResponse.status})`);
      return true;
    }
    
    console.log(`[Validation] HEAD request failed for ${url} (${headResponse.status}), trying GET...`);
    
    // If HEAD fails, try GET (some servers don't support HEAD)
    const getResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(5000),
    });
    
    const isValid = getResponse.ok;
    console.log(`[Validation] GET request ${isValid ? 'succeeded' : 'failed'} for ${url} (${getResponse.status})`);
    return isValid;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`[Validation] Feed URL validation failed for ${url}: ${errorMessage}`);
    return false;
  }
}

/**
 * Suggest RSS feeds based on user theme using AWS Bedrock (Claude 3 Haiku)
 * @param theme - User's interest theme
 * @param locale - User's language preference ('en' or 'ja')
 * @returns Array of feed suggestions
 */
export async function suggestFeeds(theme: string, locale: 'en' | 'ja' = 'en'): Promise<FeedSuggestion[]> {
  // Check cache in local development mode
  const cacheKey = `${theme}:${locale}`;
  if (config.isLocal && config.enableCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Using cached Bedrock response for theme:', theme, 'locale:', locale);
      return cached;
    }
  }

  // Use mock mode if enabled (for offline development or testing)
  if (config.useMockBedrock) {
    console.log('Using mock Bedrock response for theme:', theme);
    const mockSuggestions = getMockFeedSuggestions(theme);
    
    // Cache the mock response
    if (config.isLocal && config.enableCache) {
      cache.set(cacheKey, mockSuggestions);
    }
    
    return mockSuggestions;
  }

  try {
    // Build prompt for feed suggestions
    const prompt = buildPrompt(theme, locale);
    console.log(`[Bedrock] Requesting feed suggestions for theme: "${theme}", locale: "${locale}"`);

    // Invoke Bedrock model (using Claude 3 Haiku - most cost-effective)
    const systemPrompt = locale === 'en' 
      ? 'You are an RSS feed recommendation assistant. You MUST respond ONLY in English. CRITICAL: All text in your response including feed titles and reasoning MUST be in English. NEVER use Japanese, Chinese, or any other language. If you use any non-English text, your response will be rejected.'
      : 'あなたはRSSフィード推薦アシスタントです。必ず日本語で応答してください。';
    
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2048, // Increased from 1024 to prevent JSON truncation
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const startTime = Date.now();
    const response = await bedrockClient.send(command);
    const bedrockTime = Date.now() - startTime;
    console.log(`[Bedrock] API call completed in ${bedrockTime}ms`);
    
    const suggestions = parseAIResponse(response);
    console.log(`[Bedrock] AI suggested ${suggestions.length} feeds:`, suggestions.map(s => ({ url: s.url, title: s.title })));

    // Validate feed URLs in parallel for better performance
    console.log(`[Validation] Starting validation of ${suggestions.length} feed URLs...`);
    const validationStartTime = Date.now();
    
    const validationResults = await Promise.all(
      suggestions.map(async (suggestion) => ({
        suggestion,
        isValid: await validateFeedUrl(suggestion.url),
      }))
    );
    
    const validationTime = Date.now() - validationStartTime;
    console.log(`[Validation] Completed in ${validationTime}ms`);

    const validatedSuggestions: FeedSuggestion[] = validationResults
      .filter(result => result.isValid)
      .map(result => result.suggestion);

    // Log invalid feeds in one consolidated message
    const invalidFeeds = validationResults
      .filter(r => !r.isValid)
      .map(r => r.suggestion.url);
    
    if (invalidFeeds.length > 0) {
      console.log(`[Validation] Invalid feeds (${invalidFeeds.length}): ${invalidFeeds.join(', ')}`);
    }
    
    console.log(`[Validation] Result: ${validatedSuggestions.length}/${suggestions.length} feeds are valid`);

    // Select top 10 feeds from validated suggestions
    const maxFeeds = 10;
    const topFeeds = validatedSuggestions.slice(0, maxFeeds);
    
    if (validatedSuggestions.length > maxFeeds) {
      console.log(`[Selection] Selected top ${maxFeeds} feeds from ${validatedSuggestions.length} valid feeds`);
    }

    // If we have less than 3 valid feeds, supplement with defaults (max 2 default feeds)
    if (topFeeds.length < 3) {
      console.log(`[Fallback] Only ${topFeeds.length} valid feeds found, supplementing with defaults (max 2)`);
      const defaultFeeds = getDefaultFeedSuggestions(theme);
      
      // Add default feeds that aren't already in the list (max 2)
      const existingUrls = new Set(topFeeds.map(s => s.url));
      let defaultFeedsAdded = 0;
      const maxDefaultFeeds = 2;
      
      for (const defaultFeed of defaultFeeds) {
        if (defaultFeedsAdded >= maxDefaultFeeds) {
          break;
        }
        if (!existingUrls.has(defaultFeed.url)) {
          // Mark as default feed for lower priority
          topFeeds.push({ ...defaultFeed, isDefault: true } as any);
          console.log(`[Fallback] Added default feed (${defaultFeedsAdded + 1}/${maxDefaultFeeds}): ${defaultFeed.url}`);
          defaultFeedsAdded++;
        }
      }
      
      console.log(`[Fallback] Total feeds after supplementing: ${topFeeds.length} (${defaultFeedsAdded} defaults)`);
    }

    // Cache the result in local development
    if (config.isLocal && config.enableCache) {
      cache.set(cacheKey, topFeeds);
    }

    return topFeeds;
  } catch (error) {
    console.error('[Bedrock] API error occurred:', error);
    if (error instanceof Error) {
      console.error('[Bedrock] Error message:', error.message);
      console.error('[Bedrock] Error stack:', error.stack);
    }
    // Fallback to default feeds on error
    console.log('[Fallback] Using default feeds due to Bedrock error');
    return getDefaultFeedSuggestions(theme);
  }
}

/**
 * Build prompt for AI feed suggestions
 */
function buildPrompt(theme: string, locale: 'en' | 'ja' = 'en'): string {
  if (locale === 'ja') {
    return `ユーザーが「${theme}」に興味があります。関連する日本語のRSSフィードを20個提案してください。

重要な制約：
1. **テーマとの関連性が最重要**: 「${theme}」に特化したフィードのみを提案してください
2. **一般的なニュースサイトは避ける**: NHK、朝日新聞、読売新聞などの一般ニュースサイトは、「${theme}」専門のセクションがない限り提案しないでください
3. 実際に存在し、現在もアクティブな日本語のRSSフィードのURLのみを提案してください
4. 「${theme}」に特化した専門メディア、ブログ、ウェブサイトを優先してください
5. 架空のURLや存在しないフィードは絶対に提案しないでください
6. フィードURLは必ず /rss、/feed、/rss.xml、/feed.xml、/index.xml などで終わる正しい形式にしてください
7. テーマとの関連度が高い順に並べてください（最も関連度が高いものを最初に）
8. 必ず完全なJSON形式で返してください（途中で切れないように）

「${theme}」の良い提案例：
- 「${theme}」専門のウェブサイト
- 「${theme}」業界の専門誌
- 「${theme}」に特化したエキスパートブログ
- 「${theme}」に関する学術・研究フィード

悪い提案例（提案しないでください）：
- 一般的なニュースサイト（NHK、朝日新聞、読売新聞のトップページ）
- 無関係なテクノロジーやビジネスフィード
- 一般的な世界ニュースフィード

各フィードについて、以下の情報をJSON形式で返してください：
- url: RSSフィードのURL（必ず実在する日本語のもの）
- title: フィードの名前（日本語）
- reasoning: なぜこのフィードを提案するのか（日本語で1-2文で簡潔に）

レスポンス形式（必ず完全なJSONで返してください）：
{
  "feeds": [
    {
      "url": "https://example.jp/feed",
      "title": "サンプルフィード",
      "reasoning": "${theme}に関する最新情報を提供"
    }
  ]
}

信頼できる日本語フィードの例：
- 技術: https://www.itmedia.co.jp/rss/2.0/news_bursts.xml
- ニュース: https://www3.nhk.or.jp/rss/news/cat0.xml
- Yahoo: https://news.yahoo.co.jp/rss/topics/top-picks.xml

必ず実在する、アクセス可能な日本語のRSSフィードのURLを提案してください。
レスポンスは必ず完全なJSON形式で終わらせてください（}で閉じる）。`;
  } else {
    return `The user is interested in "${theme}". Please suggest 20 related RSS feeds.

CRITICAL LANGUAGE REQUIREMENT: 
- You MUST write ALL text in English
- Feed titles MUST be in English
- Reasoning MUST be in English  
- DO NOT use Japanese characters (日本語) or any other language
- If the feed is from a non-English source, translate the title to English

Important constraints:
1. **THEME RELEVANCE IS CRITICAL**: Only suggest feeds that are SPECIFICALLY about "${theme}"
2. **AVOID GENERIC NEWS**: Do NOT suggest general news sites (BBC, NYT, Reuters, Guardian) unless they have a specific "${theme}" section
3. Only suggest RSS feed URLs that actually exist and are currently active
4. Prioritize specialized media, blogs, and websites focused on "${theme}"
5. Never suggest fictional or non-existent feed URLs
6. Feed URLs must end with proper formats like /rss, /feed, /rss.xml, /feed.xml, /index.xml
7. Sort by relevance to the theme (most relevant first)

Examples of GOOD suggestions for "${theme}":
- Specialized websites about "${theme}"
- Industry-specific publications for "${theme}"
- Expert blogs focused on "${theme}"
- Academic or research feeds about "${theme}"

Examples of BAD suggestions (DO NOT SUGGEST):
- General news sites (BBC News, NYT Homepage, Reuters Top News)
- Generic world news feeds
- Unrelated technology or business feeds

For each feed, provide the following information in JSON format:
- url: RSS feed URL (must be real and in English)
- title: Feed name (in English - DO NOT use Japanese)
- reasoning: Why you recommend this feed (1-2 sentences in English - DO NOT use Japanese)

Response format (ALL TEXT MUST BE IN ENGLISH):
{
  "feeds": [
    {
      "url": "https://example.com/feed",
      "title": "Example Feed (IN ENGLISH)",
      "reasoning": "This feed provides the latest information about ${theme} (IN ENGLISH)"
    }
  ]
}

Examples of CORRECT English responses:
- Technology: 
  {"url": "https://techcrunch.com/feed/", "title": "TechCrunch", "reasoning": "Leading technology news and startup coverage"}
- News: 
  {"url": "https://feeds.bbci.co.uk/news/rss.xml", "title": "BBC News", "reasoning": "Comprehensive international news coverage"}

FINAL REMINDER: Write EVERYTHING in English. No Japanese (日本語), no Chinese, no other languages. Only English alphabet and words.`;
  }
}

/**
 * Parse AI response to extract feed suggestions
 */
function parseAIResponse(response: any): FeedSuggestion[] {
  try {
    // Decode response body
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // Log raw response only in local development
    if (config.isLocal) {
      console.log('[Bedrock] Raw AI response:', content.substring(0, 200) + '...');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Bedrock] No JSON found in response');
      throw new Error('No JSON found in response');
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (jsonError) {
      // If JSON parsing fails, try to fix common issues
      console.error('[Bedrock] JSON parse error, attempting to fix:', jsonError);
      
      // Try to extract feeds array even if JSON is incomplete
      // Use greedy quantifier to capture entire feeds array
      const feedsMatch = content.match(/"feeds"\s*:\s*\[[\s\S]*\]/);
      if (feedsMatch) {
        // Try to parse just the feeds array
        try {
          const feedsJson = `{${feedsMatch[0]}}`;
          parsed = JSON.parse(feedsJson);
          console.log('[Bedrock] Successfully recovered feeds from partial JSON');
        } catch (recoveryError) {
          console.error('[Bedrock] Failed to recover feeds:', recoveryError);
          throw jsonError;
        }
      } else {
        throw jsonError;
      }
    }

    const feeds = parsed.feeds || [];
    console.log(`[Bedrock] Parsed ${feeds.length} feeds from AI response`);

    // Validate and return suggestions (up to 20)
    return feeds.slice(0, 20).map((feed: any) => ({
      url: feed.url || '',
      title: feed.title || 'Unknown Feed',
      reasoning: feed.reasoning || '',
    }));
  } catch (error) {
    console.error('[Bedrock] Failed to parse AI response:', error);
    if (error instanceof Error) {
      console.error('[Bedrock] Parse error details:', error.message);
    }
    throw error;
  }
}

/**
 * Get theme-specific feed suggestions
 */
function getThemeSpecificFeeds(theme: string): FeedSuggestion[] {
  const themeLower = theme.toLowerCase();
  
  // Technology/Tech
  if (themeLower.includes('tech') || themeLower.includes('テクノロジー')) {
    return [
      { url: 'https://feeds.arstechnica.com/arstechnica/index', title: 'Ars Technica', reasoning: 'Technology news and analysis' },
      { url: 'https://www.wired.com/feed/rss', title: 'WIRED', reasoning: 'Technology, science, and culture' },
      { url: 'https://techcrunch.com/feed/', title: 'TechCrunch', reasoning: 'Startup and technology news' },
      { url: 'https://www.theverge.com/rss/index.xml', title: 'The Verge', reasoning: 'Technology and digital culture' },
      { url: 'https://www.engadget.com/rss.xml', title: 'Engadget', reasoning: 'Consumer electronics and gadgets' },
    ];
  }
  
  // Health/Medical
  if (themeLower.includes('health') || themeLower.includes('medical') || themeLower.includes('健康') || themeLower.includes('医療')) {
    return [
      { url: 'https://www.medicalnewstoday.com/rss', title: 'Medical News Today', reasoning: 'Health and medical news' },
      { url: 'https://www.healthline.com/rss', title: 'Healthline', reasoning: 'Health information and wellness' },
      { url: 'https://www.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC', title: 'WebMD', reasoning: 'Medical information and health news' },
      { url: 'https://www.sciencedaily.com/rss/health_medicine.xml', title: 'ScienceDaily Health', reasoning: 'Health and medicine research news' },
      { url: 'https://feeds.feedburner.com/HealthNews', title: 'Health News', reasoning: 'Latest health news and updates' },
    ];
  }
  
  // Business/Finance
  if (themeLower.includes('business') || themeLower.includes('finance') || themeLower.includes('ビジネス') || themeLower.includes('経済')) {
    return [
      { url: 'https://www.bloomberg.com/feed/podcast/etf-report.xml', title: 'Bloomberg', reasoning: 'Business and financial news' },
      { url: 'https://www.ft.com/?format=rss', title: 'Financial Times', reasoning: 'Global business news' },
      { url: 'https://www.economist.com/rss', title: 'The Economist', reasoning: 'Business and economic analysis' },
      { url: 'https://www.wsj.com/xml/rss/3_7085.xml', title: 'Wall Street Journal', reasoning: 'Business and market news' },
      { url: 'https://feeds.reuters.com/reuters/businessNews', title: 'Reuters Business', reasoning: 'Business news updates' },
    ];
  }
  
  // Politics
  if (themeLower.includes('politics') || themeLower.includes('政治')) {
    return [
      { url: 'https://www.bbc.com/news/politics/rss.xml', title: 'BBC Politics', reasoning: 'Political news and analysis' },
      { url: 'https://www.politico.com/rss/politics08.xml', title: 'Politico', reasoning: 'Political news and policy' },
      { url: 'https://thehill.com/rss/syndicator/19109', title: 'The Hill', reasoning: 'Political news and commentary' },
      { url: 'https://feeds.reuters.com/Reuters/PoliticsNews', title: 'Reuters Politics', reasoning: 'Political news updates' },
      { url: 'https://www.theguardian.com/politics/rss', title: 'Guardian Politics', reasoning: 'Political news and opinion' },
    ];
  }
  
  // Science
  if (themeLower.includes('science') || themeLower.includes('科学')) {
    return [
      { url: 'https://www.sciencedaily.com/rss/all.xml', title: 'ScienceDaily', reasoning: 'Latest science news' },
      { url: 'https://www.nature.com/nature.rss', title: 'Nature', reasoning: 'Scientific research and news' },
      { url: 'https://www.sciencemag.org/rss/news_current.xml', title: 'Science Magazine', reasoning: 'Science news and research' },
      { url: 'https://phys.org/rss-feed/', title: 'Phys.org', reasoning: 'Physics and science news' },
      { url: 'https://www.newscientist.com/feed/home', title: 'New Scientist', reasoning: 'Science and technology news' },
    ];
  }
  
  // Sports
  if (themeLower.includes('sport') || themeLower.includes('スポーツ')) {
    return [
      { url: 'https://www.espn.com/espn/rss/news', title: 'ESPN', reasoning: 'Sports news and updates' },
      { url: 'https://www.bbc.com/sport/rss.xml', title: 'BBC Sport', reasoning: 'Sports news coverage' },
      { url: 'https://www.theguardian.com/sport/rss', title: 'Guardian Sport', reasoning: 'Sports news and analysis' },
      { url: 'https://feeds.reuters.com/reuters/sportsNews', title: 'Reuters Sports', reasoning: 'Sports news updates' },
      { url: 'https://www.si.com/rss/si_topstories.rss', title: 'Sports Illustrated', reasoning: 'Sports news and features' },
    ];
  }
  
  // Entertainment/Culture
  if (themeLower.includes('entertainment') || themeLower.includes('culture') || themeLower.includes('エンタメ') || themeLower.includes('文化')) {
    return [
      { url: 'https://variety.com/feed/', title: 'Variety', reasoning: 'Entertainment news' },
      { url: 'https://www.hollywoodreporter.com/feed/', title: 'Hollywood Reporter', reasoning: 'Entertainment industry news' },
      { url: 'https://www.rollingstone.com/feed/', title: 'Rolling Stone', reasoning: 'Music and culture news' },
      { url: 'https://www.theguardian.com/culture/rss', title: 'Guardian Culture', reasoning: 'Arts and culture news' },
      { url: 'https://www.bbc.com/culture/rss', title: 'BBC Culture', reasoning: 'Cultural news and features' },
    ];
  }
  
  // Travel
  if (themeLower.includes('travel') || themeLower.includes('旅行') || themeLower.includes('観光')) {
    return [
      { url: 'https://www.lonelyplanet.com/feed', title: 'Lonely Planet', reasoning: 'Travel guides and destination information' },
      { url: 'https://www.nationalgeographic.com/travel/rss', title: 'National Geographic Travel', reasoning: 'Travel stories and photography' },
      { url: 'https://www.travelandleisure.com/rss', title: 'Travel + Leisure', reasoning: 'Travel tips and destination guides' },
      { url: 'https://www.cntraveler.com/feed/rss', title: 'Condé Nast Traveler', reasoning: 'Luxury travel and destinations' },
      { url: 'https://www.nomadicmatt.com/feed/', title: 'Nomadic Matt', reasoning: 'Budget travel tips and guides' },
    ];
  }
  
  // Default: Return empty array to avoid generic feeds
  // This forces Bedrock to provide theme-specific suggestions
  return [];
}

/**
 * Get mock feed suggestions for offline development
 */
function getMockFeedSuggestions(theme: string): FeedSuggestion[] {
  // Try to get theme-specific feeds first
  const themeFeeds = getThemeSpecificFeeds(theme);
  if (themeFeeds.length > 0) {
    return themeFeeds;
  }
  
  // Only use generic feeds as last resort
  return [
    {
      url: 'https://feeds.bbci.co.uk/news/rss.xml',
      title: 'BBC News',
      reasoning: `General news and information relevant to the theme: ${theme}`,
    },
    {
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
      title: 'The New York Times',
      reasoning: `In-depth articles and analysis related to the theme: ${theme}`,
    },
    {
      url: 'https://feeds.reuters.com/reuters/topNews',
      title: 'Reuters Top News',
      reasoning: `Breaking news and updates about the theme: ${theme}`,
    },
    {
      url: 'https://www.theguardian.com/world/rss',
      title: 'The Guardian World News',
      reasoning: `Global perspective on the theme: ${theme}`,
    },
    {
      url: 'https://feeds.arstechnica.com/arstechnica/index',
      title: 'Ars Technica',
      reasoning: `Technology and science coverage of the theme: ${theme}`,
    },
  ];
}

/**
 * Get default feed suggestions as fallback
 */
function getDefaultFeedSuggestions(theme: string): FeedSuggestion[] {
  console.log('Using default feed suggestions for theme:', theme);
  return getMockFeedSuggestions(theme);
}
