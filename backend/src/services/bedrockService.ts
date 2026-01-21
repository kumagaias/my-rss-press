import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';
import { getAllDefaultFeeds as getDefaultFeedsFromFallback } from './categoryFallback.js';
import { getCategoryByTheme } from './categoryService.js';
import { categoryCache } from './categoryCache.js';
import { getPopularFeeds } from './feedUsageService.js';

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
 * Generate a random newspaper name based on theme and locale
 * @param theme - User's theme input
 * @param locale - Locale ('en' or 'ja')
 * @returns Random newspaper name
 */
function generateNewspaperName(theme: string, locale: 'en' | 'ja'): string {
  if (locale === 'ja') {
    const suffixes = ['新聞', 'デイリー', 'ニュース', 'メディア', 'タイムズ', 'プレス'];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${theme}${randomSuffix}`;
  } else {
    const formats = [
      `The ${theme} Daily`,
      `${theme} News`,
      `${theme} Times`,
      `${theme} Press`,
      `${theme} Media`,
      `The ${theme} Post`,
    ];
    return formats[Math.floor(Math.random() * formats.length)];
  }
}

/**
 * Get feeds from DynamoDB based on theme
 * @param theme - User's theme input
 * @param locale - Locale ('en' or 'ja')
 * @returns Array of feed suggestions from DynamoDB
 */
async function getFeedsFromDynamoDB(theme: string, locale: 'en' | 'ja'): Promise<FeedSuggestion[]> {
  try {
    // Find matching category
    const category = await getCategoryByTheme(theme, locale);
    
    if (!category) {
      console.log(`[DynamoDB] No matching category found for theme: ${theme}`);
      return [];
    }
    
    console.log(`[DynamoDB] Found matching category: ${category.displayName} (${category.categoryId})`);
    
    // Get feeds for the category
    const feeds = await categoryCache.getFeeds(category.categoryId);
    
    if (feeds.length === 0) {
      console.log(`[DynamoDB] No feeds found for category: ${category.categoryId}`);
      return [];
    }
    
    console.log(`[DynamoDB] Found ${feeds.length} feeds for category: ${category.categoryId}`);
    
    // Convert to FeedSuggestion format
    return feeds.map(feed => ({
      url: feed.url,
      title: feed.title,
      reasoning: feed.description || `Feed from ${category.displayName} category`,
      isDefault: false, // DynamoDB feeds are not default feeds
    }));
  } catch (error) {
    console.error('[DynamoDB] Error fetching feeds:', error);
    return [];
  }
}

/**
 * Get popular feeds from usage tracking
 * @param theme - User's theme input
 * @param locale - Locale ('en' or 'ja')
 * @returns Array of popular feed suggestions
 */
async function getPopularFeedsFromUsage(theme: string, locale: 'en' | 'ja'): Promise<FeedSuggestion[]> {
  try {
    // Find matching category
    const category = await getCategoryByTheme(theme, locale);
    
    if (!category) {
      console.log(`[Popular] No matching category found for theme: ${theme}`);
      return [];
    }
    
    console.log(`[Popular] Found matching category: ${category.displayName} (${category.categoryId})`);
    
    // Get popular feeds for the category
    const popularFeeds = await getPopularFeeds(category.categoryId, 5);
    
    if (popularFeeds.length === 0) {
      console.log(`[Popular] No popular feeds found for category: ${category.categoryId}`);
      return [];
    }
    
    console.log(`[Popular] Found ${popularFeeds.length} popular feeds for category: ${category.categoryId}`);
    
    // Convert to FeedSuggestion format
    return popularFeeds.map(feed => ({
      url: feed.url,
      title: feed.title,
      reasoning: `Popular feed (used ${feed.usageCount} times, ${feed.successRate.toFixed(0)}% success rate)`,
      isDefault: false,
    }));
  } catch (error) {
    console.error('[Popular] Error fetching popular feeds:', error);
    return [];
  }
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
    // Note: No system prompt - testing if it improves URL quality
    
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 8192, // Increased to handle 20 feeds without truncation
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
    
    // Log raw response for debugging
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // Log complete response for debugging (split into chunks to avoid CloudWatch truncation)
    console.log(`[Bedrock] === COMPLETE RESPONSE START (${content.length} chars) ===`);
    const chunkSize = 2000;
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.substring(i, Math.min(i + chunkSize, content.length));
      const chunkNum = Math.floor(i / chunkSize) + 1;
      const totalChunks = Math.ceil(content.length / chunkSize);
      console.log(`[Bedrock] CHUNK ${chunkNum}/${totalChunks}:`);
      console.log(chunk);
    }
    console.log(`[Bedrock] === COMPLETE RESPONSE END ===`);
    
    const result = parseAIResponse(response, theme, locale);
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

    // If we have 0 valid feeds, try popular feeds first, then DynamoDB, then default
    if (topFeeds.length === 0) {
      console.log(`[Fallback] No valid feeds from Bedrock, trying popular and DynamoDB feeds in parallel`);
      
      // Try to get popular feeds and DynamoDB feeds in parallel
      const [popularFeeds, dynamoDBFeeds] = await Promise.all([
        getPopularFeedsFromUsage(theme, locale),
        getFeedsFromDynamoDB(theme, locale),
      ]);
      
      if (popularFeeds.length > 0) {
        console.log(`[Popular] Using ${popularFeeds.length} popular feeds`);
        return {
          feeds: popularFeeds.slice(0, 15), // Limit to 15 feeds
          newspaperName: generateNewspaperName(theme, locale),
        };
      }
      
      if (dynamoDBFeeds.length > 0) {
        console.log(`[DynamoDB] Using ${dynamoDBFeeds.length} feeds from DynamoDB`);
        return {
          feeds: dynamoDBFeeds.slice(0, 15), // Limit to 15 feeds
          newspaperName: generateNewspaperName(theme, locale),
        };
      }
      
      // If no popular or DynamoDB feeds, use default feeds
      console.log(`[Fallback] No popular or DynamoDB feeds, returning 1 random default feed`);
      const defaultFeeds = getAllDefaultFeeds(locale);
      const randomIndex = Math.floor(Math.random() * defaultFeeds.length);
      const randomDefaultFeed = defaultFeeds[randomIndex];
      
      console.log(`[Fallback] Selected random default feed: ${randomDefaultFeed.title} (${randomDefaultFeed.url})`);
      
      return {
        feeds: [{ ...randomDefaultFeed, isDefault: true }],
        newspaperName: generateNewspaperName(theme, locale),
      };
    }
    
    // Add popular feeds and DynamoDB feeds to supplement Bedrock suggestions (fetch in parallel)
    const [popularFeeds, dynamoDBFeeds] = await Promise.all([
      getPopularFeedsFromUsage(theme, locale),
      getFeedsFromDynamoDB(theme, locale),
    ]);
    
    if (popularFeeds.length > 0) {
      console.log(`[Popular] Found ${popularFeeds.length} popular feeds from usage tracking`);
      
      // Add popular feeds that are not already in the list
      const existingUrls = new Set(topFeeds.map(s => s.url));
      const newPopularFeeds = popularFeeds.filter(feed => !existingUrls.has(feed.url));
      
      if (newPopularFeeds.length > 0) {
        // Add popular feeds at the beginning (highest priority)
        topFeeds.unshift(...newPopularFeeds);
        console.log(`[Popular] Added ${newPopularFeeds.length} popular feeds at the beginning`);
      }
    }
    
    if (dynamoDBFeeds.length > 0) {
      console.log(`[DynamoDB] Found ${dynamoDBFeeds.length} relevant feeds from DynamoDB`);
      
      // Add DynamoDB feeds that are not already in the list
      const existingUrls = new Set(topFeeds.map(s => s.url));
      const newDynamoDBFeeds = dynamoDBFeeds.filter(feed => !existingUrls.has(feed.url));
      
      if (newDynamoDBFeeds.length > 0) {
        // Add up to 5 DynamoDB feeds
        const feedsToAdd = newDynamoDBFeeds.slice(0, 5);
        topFeeds.push(...feedsToAdd);
        console.log(`[DynamoDB] Added ${feedsToAdd.length} feeds from DynamoDB`);
      }
    }
    
    // Add 1 random default feed (with lower priority) if we have room
    if (topFeeds.length < 15) {
      const defaultFeeds = getAllDefaultFeeds(locale);
      const randomIndex = Math.floor(Math.random() * defaultFeeds.length);
      const randomDefaultFeed = defaultFeeds[randomIndex];
      
      // Check if the random default feed is not already in the list
      const existingUrls = new Set(topFeeds.map(s => s.url));
      if (!existingUrls.has(randomDefaultFeed.url)) {
        topFeeds.push({ ...randomDefaultFeed, isDefault: true });
        console.log(`[Default] Added random default feed: ${randomDefaultFeed.title} (${randomDefaultFeed.url})`);
      } else {
        console.log(`[Default] Random default feed already exists in suggestions: ${randomDefaultFeed.title}`);
      }
    }
    
    console.log(`[Success] Total feeds: ${topFeeds.length}`);

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
- reasoning は20文字以内で簡潔に

重要: 完全で正しいJSONのみを返してください。説明文や前置きは不要です。すべてのフィールドを完全に記述してください。

{
  "newspaperName": "${theme}に関する新聞名",
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
- Keep reasoning under 20 words

CRITICAL: Return ONLY complete, valid JSON. No explanations. Complete all fields properly.

{
  "newspaperName": "Newspaper name about ${theme}",
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
 * @param response - Bedrock API response
 * @param theme - User's theme (for fallback newspaper name)
 * @param locale - User's locale (for fallback newspaper name)
 */
function parseAIResponse(response: any, theme: string, locale: 'en' | 'ja'): FeedSuggestionsResponse {
  try {
    // Decode response body
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // Log raw response only in local development
    if (config.isLocal) {
      console.log('[Bedrock] Raw AI response:', content.substring(0, 200) + '...');
    }

    // Extract JSON from response - try multiple strategies
    let jsonString = '';
    
    // Strategy 1: Find JSON between first { and last }
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonString = content.substring(firstBrace, lastBrace + 1);
      console.log(`[Bedrock] Extracted JSON length: ${jsonString.length} characters`);
    } else {
      console.error('[Bedrock] No JSON found in response');
      console.error('[Bedrock] Response content:', content);
      throw new Error('No JSON found in response');
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (jsonError) {
      // If JSON parsing fails, try to fix common issues
      console.error('[Bedrock] JSON parse error, attempting to fix:', jsonError);
      console.error('[Bedrock] JSON string (first 1000 chars):', jsonString.substring(0, 1000));
      console.error('[Bedrock] JSON string (last 1000 chars):', jsonString.substring(Math.max(0, jsonString.length - 1000)));
      
      // Strategy 2: Try to clean up the JSON string
      let cleanedJson = jsonString;
      
      // Remove any trailing commas before closing brackets/braces
      cleanedJson = cleanedJson.replace(/,(\s*[}\]])/g, '$1');
      
      // Remove any control characters that might break JSON
      // eslint-disable-next-line no-control-regex
      cleanedJson = cleanedJson.replace(/[\x00-\x1F\x7F]/g, '');
      
      // Try parsing the cleaned JSON
      try {
        parsed = JSON.parse(cleanedJson);
        console.log('[Bedrock] Successfully parsed cleaned JSON');
      } catch {
        console.error('[Bedrock] Cleaned JSON still failed to parse');
        
        // Strategy 3: Try to extract just the feeds array
        const feedsMatch = content.match(/"feeds"\s*:\s*\[([\s\S]*?)\]\s*[,}]/);
        if (feedsMatch) {
          try {
            // Reconstruct a minimal valid JSON with just the feeds array
            const feedsArrayStr = feedsMatch[1];
            const reconstructedJson = `{"feeds":[${feedsArrayStr}]}`;
            console.log(`[Bedrock] Attempting to parse reconstructed JSON (${reconstructedJson.length} chars)`);
            parsed = JSON.parse(reconstructedJson);
            console.log('[Bedrock] Successfully recovered feeds from partial JSON');
          } catch (recoveryError) {
            console.error('[Bedrock] Failed to recover feeds:', recoveryError);
            
            // Strategy 4: Try to manually extract feed objects
            try {
              const feeds = extractFeedsManually(content);
              if (feeds.length > 0) {
                console.log(`[Bedrock] Manually extracted ${feeds.length} feeds`);
                parsed = { feeds };
              } else {
                throw jsonError;
              }
            } catch (manualError) {
              console.error('[Bedrock] Manual extraction failed:', manualError);
              throw jsonError;
            }
          }
        } else {
          console.error('[Bedrock] Could not find feeds array in response');
          throw jsonError;
        }
      }
    }

    const feeds = parsed.feeds || [];
    let newspaperName = parsed.newspaperName || '';
    
    // If AI didn't provide a newspaper name, generate a random one
    if (!newspaperName || newspaperName.trim() === '') {
      newspaperName = generateNewspaperName(theme, locale);
      console.log(`[Bedrock] AI didn't provide newspaper name, generated: ${newspaperName}`);
    } else {
      console.log(`[Bedrock] AI suggested newspaper name: ${newspaperName}`);
    }
    
    console.log(`[Bedrock] Parsed ${feeds.length} feeds from AI response`);

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
 * Manually extract feed objects from malformed JSON
 * This is a last-resort fallback when JSON parsing fails
 */
function extractFeedsManually(content: string): Array<{ url: string; title: string; reasoning: string }> {
  const feeds: Array<{ url: string; title: string; reasoning: string }> = [];
  
  try {
    // Find all feed objects using regex
    // Match pattern: { "url": "...", "title": "...", "reasoning": "..." }
    const feedPattern = /\{\s*"url"\s*:\s*"([^"]+)"\s*,\s*"title"\s*:\s*"([^"]+)"\s*,\s*"reasoning"\s*:\s*"([^"]+)"\s*\}/g;
    
    let match;
    while ((match = feedPattern.exec(content)) !== null) {
      feeds.push({
        url: match[1],
        title: match[2],
        reasoning: match[3],
      });
    }
    
    console.log(`[Manual] Extracted ${feeds.length} feeds using regex`);
    return feeds;
  } catch (error) {
    console.error('[Manual] Failed to extract feeds manually:', error);
    return [];
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
 * 
 * Note: This function now uses categoryFallback for consistency
 */
export function getAllDefaultFeeds(locale: 'en' | 'ja' = 'en'): FeedSuggestion[] {
  const defaultFeeds = getDefaultFeedsFromFallback(locale);
  
  return defaultFeeds.map(feed => ({
    url: feed.url,
    title: feed.title,
    reasoning: feed.description,
  }));
}


