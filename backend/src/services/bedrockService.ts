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

export interface FeedSuggestionsResponse {
  feeds: FeedSuggestion[];
  newspaperName: string; // AI-suggested newspaper name based on theme
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
      signal: AbortSignal.timeout(5000), // 5s timeout per URL (with batching, total time is manageable)
      redirect: 'follow', // Allow redirects as fallback
    });
    
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
    
    console.log(`[Validation] ✅ Valid feed: ${url} (${getResponse.status}, ${contentType})`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`[Validation] ❌ Failed: ${url} - ${errorMessage}`);
    return false;
  }
}

/**
 * Suggest RSS feeds based on user theme using AWS Bedrock (Claude 3 Haiku)
 * @param theme - User's interest theme
 * @param locale - User's language preference ('en' or 'ja')
 * @returns Feed suggestions with AI-suggested newspaper name
 */
export async function suggestFeeds(theme: string, locale: 'en' | 'ja' = 'en'): Promise<FeedSuggestionsResponse> {
  // Check cache in local development mode
  const cacheKey = `${theme}:${locale}`;
  if (config.isLocal && config.enableCache) {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Using cached Bedrock response for theme:', theme, 'locale:', locale);
      return {
        feeds: cached,
        newspaperName: `${theme} Daily`, // Default name for cached responses
      };
    }
  }

  // Use mock mode if enabled (for offline development or testing)
  if (config.useMockBedrock) {
    console.log('Using mock Bedrock response for theme:', theme);
    const mockSuggestions = getMockFeedSuggestions(theme);
    const mockResponse: FeedSuggestionsResponse = {
      feeds: mockSuggestions,
      newspaperName: `${theme} Daily`,
    };
    
    // Cache the mock response
    if (config.isLocal && config.enableCache) {
      cache.set(cacheKey, mockResponse.feeds);
    }
    
    return mockResponse;
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
        max_tokens: 8192, // Increased to handle 20 feeds without truncation
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
    
    // Log raw response for debugging (first 500 chars)
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    console.log(`[Bedrock] Raw response (first 500 chars): ${content.substring(0, 500)}`);
    console.log(`[Bedrock] Raw response (last 500 chars): ${content.substring(Math.max(0, content.length - 500))}`);
    console.log(`[Bedrock] Total response length: ${content.length} characters`);
    
    const result = parseAIResponse(response);
    console.log(`[Bedrock] AI suggested ${result.feeds.length} feeds:`, result.feeds.map(s => ({ url: s.url, title: s.title })));
    console.log(`[Bedrock] AI suggested newspaper name: ${result.newspaperName}`);
    
    // Remove duplicate URLs (keep first occurrence)
    const uniqueSuggestions: FeedSuggestion[] = [];
    const seenUrls = new Set<string>();
    
    for (const suggestion of result.feeds) {
      if (!seenUrls.has(suggestion.url)) {
        uniqueSuggestions.push(suggestion);
        seenUrls.add(suggestion.url);
      } else {
        console.log(`[Deduplication] Removed duplicate URL: ${suggestion.url}`);
      }
    }
    
    if (uniqueSuggestions.length < result.feeds.length) {
      console.log(`[Deduplication] Removed ${result.feeds.length - uniqueSuggestions.length} duplicate URLs`);
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
      .map(result => ({
        ...result.suggestion,
        // Ensure all URLs use https://
        url: result.suggestion.url.replace(/^http:\/\//i, 'https://'),
      }));

    // Log invalid feeds in one consolidated message
    const invalidFeeds = validationResults
      .filter(r => !r.isValid)
      .map(r => r.suggestion.url);
    
    if (invalidFeeds.length > 0) {
      console.log(`[Validation] Invalid feeds (${invalidFeeds.length}): ${invalidFeeds.join(', ')}`);
    }
    
    console.log(`[Validation] Result: ${validatedSuggestions.length}/${uniqueSuggestions.length} feeds are valid`);

    // Select top 14 feeds from validated suggestions (leave room for 1 default feed)
    const maxBedrockFeeds = 14;
    const topFeeds = validatedSuggestions.slice(0, maxBedrockFeeds);
    
    if (validatedSuggestions.length > maxBedrockFeeds) {
      console.log(`[Selection] Selected top ${maxBedrockFeeds} feeds from ${validatedSuggestions.length} valid feeds`);
    }

    // If we have 0 valid feeds, return all default feeds immediately
    if (topFeeds.length === 0) {
      console.log(`[Fallback] No valid feeds from Bedrock, returning all default feeds`);
      const allDefaultFeeds = getAllDefaultFeeds(locale).map(f => ({ ...f, isDefault: true }));
      return {
        feeds: allDefaultFeeds,
        newspaperName: locale === 'ja' ? `${theme}デイリー` : `The ${theme} Daily`,
      };
    }
    
    // Add 1 random default feed (with lower priority)
    const defaultFeeds = getAllDefaultFeeds(locale);
    const randomIndex = Math.floor(Math.random() * defaultFeeds.length);
    const randomDefaultFeed = defaultFeeds[randomIndex];
    
    // Check if the random default feed is not already in the list
    const existingUrls = new Set(topFeeds.map(s => s.url));
    if (!existingUrls.has(randomDefaultFeed.url)) {
      topFeeds.push({ ...randomDefaultFeed, isDefault: true });
      console.log(`[Default] Added random default feed: ${randomDefaultFeed.title} (${randomDefaultFeed.url})`);
    } else {
      console.log(`[Default] Random default feed already exists in Bedrock suggestions: ${randomDefaultFeed.title}`);
    }
    
    console.log(`[Success] Total feeds: ${topFeeds.length} (${topFeeds.filter(f => !f.isDefault).length} from Bedrock + ${topFeeds.filter(f => f.isDefault).length} default)`)

    // Cache the result in local development
    if (config.isLocal && config.enableCache) {
      cache.set(cacheKey, topFeeds);
    }

    return {
      feeds: topFeeds,
      newspaperName: result.newspaperName,
    };
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
    return `「${theme}」に関する日本語のRSSフィードを20個提案してください。

制約：
- 実在するアクティブなRSSフィードのみ
- 「${theme}」専門のメディア、ブログ、サイトを優先
- 一般ニュースサイトは避ける
- URL形式: /rss, /feed, /rss.xml, /feed.xml, /index.xml
- 完全なJSON形式で返す

JSON形式：
{
  "newspaperName": "${theme}に関する新聞名（例：${theme}タイムズ）",
  "feeds": [
    {
      "url": "https://example.jp/feed",
      "title": "フィード名",
      "reasoning": "簡潔な理由"
    }
  ]
}`;
  } else {
    return `Suggest 20 RSS feeds about "${theme}".

Requirements:
- Only real, active RSS feeds
- Specialized media/blogs about "${theme}"
- Avoid general news sites
- URL format: /rss, /feed, /rss.xml, /feed.xml, /index.xml
- ALL text in English (titles, reasoning)
- Complete JSON format

JSON format:
{
  "newspaperName": "Newspaper name about ${theme} (e.g., The ${theme} Times)",
  "feeds": [
    {
      "url": "https://example.com/feed",
      "title": "Feed name in English",
      "reasoning": "Brief reason"
    }
  ]
}`;
  }
}

/**
 * Parse AI response to extract feed suggestions and newspaper name
 */
function parseAIResponse(response: any): FeedSuggestionsResponse {
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
      console.error('[Bedrock] Response content:', content);
      throw new Error('No JSON found in response');
    }

    const jsonString = jsonMatch[0];
    console.log(`[Bedrock] Extracted JSON length: ${jsonString.length} characters`);

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (jsonError) {
      // If JSON parsing fails, try to fix common issues
      console.error('[Bedrock] JSON parse error, attempting to fix:', jsonError);
      console.error('[Bedrock] JSON string (first 1000 chars):', jsonString.substring(0, 1000));
      console.error('[Bedrock] JSON string (last 1000 chars):', jsonString.substring(Math.max(0, jsonString.length - 1000)));
      
      // Try to extract feeds array even if JSON is incomplete
      // Use greedy quantifier to capture entire feeds array
      const feedsMatch = content.match(/"feeds"\s*:\s*\[[\s\S]*\]/);
      if (feedsMatch) {
        // Try to parse just the feeds array
        try {
          const feedsJson = `{${feedsMatch[0]}}`;
          console.log(`[Bedrock] Attempting to parse feeds array only (${feedsJson.length} chars)`);
          parsed = JSON.parse(feedsJson);
          console.log('[Bedrock] Successfully recovered feeds from partial JSON');
        } catch (recoveryError) {
          console.error('[Bedrock] Failed to recover feeds:', recoveryError);
          throw jsonError;
        }
      } else {
        console.error('[Bedrock] Could not find feeds array in response');
        throw jsonError;
      }
    }

    const feeds = parsed.feeds || [];
    const newspaperName = parsed.newspaperName || '';
    console.log(`[Bedrock] Parsed ${feeds.length} feeds from AI response`);
    console.log(`[Bedrock] Suggested newspaper name: ${newspaperName}`);

    // Validate and return suggestions (up to 20)
    const suggestions = feeds.slice(0, 20).map((feed: any) => ({
      url: feed.url || '',
      title: feed.title || 'Unknown Feed',
      reasoning: feed.reasoning || '',
    }));

    return {
      feeds: suggestions,
      newspaperName,
    };
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


