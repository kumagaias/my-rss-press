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
 * Validate if a feed URL is accessible and contains valid feed content
 */
async function validateFeedUrl(url: string): Promise<boolean> {
  try {
    // Use a more common User-Agent to avoid blocking
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
    // Use GET request to check both status and content
    const getResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(2000), // Reduced to 2s to stay within API Gateway 29s timeout
      redirect: 'manual', // Don't follow redirects automatically
    });
    
    // Reject redirects (3xx status codes)
    if (getResponse.status >= 300 && getResponse.status < 400) {
      console.log(`[Validation] Rejected redirect for ${url} (${getResponse.status})`);
      return false;
    }
    
    // Check if response is OK (2xx)
    if (!getResponse.ok) {
      console.log(`[Validation] GET request failed for ${url} (${getResponse.status})`);
      return false;
    }
    
    // Check Content-Type (should be XML-based)
    const contentType = getResponse.headers.get('content-type') || '';
    const isXmlContent = contentType.includes('xml') || contentType.includes('rss') || contentType.includes('atom');
    
    if (!isXmlContent) {
      console.log(`[Validation] Invalid content-type for ${url}: ${contentType}`);
      return false;
    }
    
    // Check if response has content (not empty)
    const contentLength = getResponse.headers.get('content-length');
    if (contentLength && parseInt(contentLength) === 0) {
      console.log(`[Validation] Empty response for ${url}`);
      return false;
    }
    
    // Read a small portion of the response to verify it's valid XML
    const text = await getResponse.text();
    if (!text || text.trim().length === 0) {
      console.log(`[Validation] Empty content for ${url}`);
      return false;
    }
    
    // Check if it looks like XML (starts with < or <?xml)
    const trimmedText = text.trim();
    if (!trimmedText.startsWith('<')) {
      console.log(`[Validation] Content doesn't look like XML for ${url}`);
      return false;
    }
    
    console.log(`[Validation] Valid feed found for ${url} (${getResponse.status}, ${contentType})`);
    return true;
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
    
    // Remove duplicate URLs (keep first occurrence)
    const uniqueSuggestions: FeedSuggestion[] = [];
    const seenUrls = new Set<string>();
    
    for (const suggestion of suggestions) {
      if (!seenUrls.has(suggestion.url)) {
        uniqueSuggestions.push(suggestion);
        seenUrls.add(suggestion.url);
      } else {
        console.log(`[Deduplication] Removed duplicate URL: ${suggestion.url}`);
      }
    }
    
    if (uniqueSuggestions.length < suggestions.length) {
      console.log(`[Deduplication] Removed ${suggestions.length - uniqueSuggestions.length} duplicate URLs`);
    }

    // Validate feed URLs in parallel for better performance
    console.log(`[Validation] Starting validation of ${uniqueSuggestions.length} feed URLs...`);
    const validationStartTime = Date.now();
    
    const validationResults = await Promise.all(
      uniqueSuggestions.map(async (suggestion) => ({
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
    
    console.log(`[Validation] Result: ${validatedSuggestions.length}/${uniqueSuggestions.length} feeds are valid`);

    // Select top 15 feeds from validated suggestions (increased from 10 for better article coverage)
    const maxFeeds = 15;
    const topFeeds = validatedSuggestions.slice(0, maxFeeds);
    
    if (validatedSuggestions.length > maxFeeds) {
      console.log(`[Selection] Selected top ${maxFeeds} feeds from ${validatedSuggestions.length} valid feeds`);
    }

    // If we have 0 valid feeds, throw error to trigger retry
    if (topFeeds.length === 0) {
      console.log(`[Error] No valid feeds found from Bedrock, will retry`);
      throw new Error('No valid feeds found from Bedrock');
    }
    
    // Minimum 3 feeds required for feed suggestions
    // If we have less than 3 valid feeds, supplement with default feeds
    if (topFeeds.length < 3) {
      console.log(`[Fallback] Only ${topFeeds.length} valid feeds found, supplementing with default feeds to reach minimum of 3`);
      const defaultFeeds = getAllDefaultFeeds(locale);
      
      // Add default feeds until we have at least 3 feeds
      const existingUrls = new Set(topFeeds.map(s => s.url));
      
      for (const defaultFeed of defaultFeeds) {
        if (!existingUrls.has(defaultFeed.url)) {
          // Mark as default feed for lower priority
          topFeeds.push({ ...defaultFeed, isDefault: true } as any);
          console.log(`[Fallback] Added default feed: ${defaultFeed.title} (${defaultFeed.url})`);
          
          // Stop when we have at least 3 feeds
          if (topFeeds.length >= 3) {
            break;
          }
        }
      }
      
      console.log(`[Fallback] Total feeds after supplementing: ${topFeeds.length}`);
    } else {
      console.log(`[Success] ${topFeeds.length} valid feeds from Bedrock, no default feed needed`);
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
    // Throw error to trigger retry logic in the endpoint
    // The endpoint will handle fallback to all default feeds after retries
    throw new Error('Bedrock API error');
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

    // Validate and return suggestions (up to 30)
    return feeds.slice(0, 30).map((feed: any) => ({
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
 * 
 * Note: This function now always returns an empty array to force
 * Bedrock AI to provide theme-specific suggestions for all themes.
 * Previously hardcoded theme support has been removed to rely on AI.
 */
function getThemeSpecificFeeds(_theme: string): FeedSuggestion[] {
  // Always return empty array to force Bedrock to provide suggestions
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
 * Get all default feeds for a locale
 * Returns all available default feeds (not shuffled)
 */
export function getAllDefaultFeeds(locale: 'en' | 'ja' = 'en'): FeedSuggestion[] {
  const englishFeeds: FeedSuggestion[] = [
    {
      url: 'https://feeds.bbci.co.uk/news/rss.xml',
      title: 'BBC News',
      reasoning: 'General news and information',
    },
    {
      url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
      title: 'The New York Times',
      reasoning: 'In-depth articles and analysis',
    },
    {
      url: 'https://feeds.reuters.com/reuters/topNews',
      title: 'Reuters Top News',
      reasoning: 'Breaking news and updates',
    },
    {
      url: 'https://www.theguardian.com/world/rss',
      title: 'The Guardian World News',
      reasoning: 'Global perspective',
    },
  ];

  const japaneseFeeds: FeedSuggestion[] = [
    {
      url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
      title: 'NHK ニュース',
      reasoning: '一般的なニュースと情報',
    },
    {
      url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf',
      title: '朝日新聞デジタル',
      reasoning: '詳細な記事と分析',
    },
    {
      url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
      title: 'Yahoo!ニュース',
      reasoning: '速報とアップデート',
    },
    {
      url: 'https://www.itmedia.co.jp/rss/2.0/news_bursts.xml',
      title: 'ITmedia NEWS',
      reasoning: 'テクノロジーとビジネスの情報',
    },
  ];

  return locale === 'ja' ? japaneseFeeds : englishFeeds;
}


