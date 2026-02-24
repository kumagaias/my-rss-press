import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';
import { getAllDefaultFeeds as getDefaultFeedsFromFallback } from './categoryFallback.js';
import { getCategoryByTheme } from './categoryService.js';
import { categoryCache } from './categoryCache.js';
import { getPopularFeeds } from './feedUsageService.js';
import { logStructuredError, logMonitoringMetrics, extractTokenUsage } from '../utils/structuredLogger.js';

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

  // OPTIMIZATION: Try database and popular feeds first (fast path)
  console.log(`[FastPath] Checking database and popular feeds for theme: "${theme}"`);
  const fastPathStartTime = Date.now();
  
  const [popularFeeds, dynamoDBFeeds] = await Promise.all([
    getPopularFeedsFromUsage(theme, locale),
    getFeedsFromDynamoDB(theme, locale),
  ]);
  
  const fastPathTime = Date.now() - fastPathStartTime;
  console.log(`[FastPath] Database lookup completed in ${fastPathTime}ms`);
  
  // Combine database and popular feeds
  const databaseFeeds: FeedSuggestion[] = [];
  const seenUrls = new Set<string>();
  
  // Add popular feeds first (highest priority)
  for (const feed of popularFeeds) {
    if (!seenUrls.has(feed.url)) {
      databaseFeeds.push(feed);
      seenUrls.add(feed.url);
    }
  }
  
  // Add DynamoDB feeds
  for (const feed of dynamoDBFeeds) {
    if (!seenUrls.has(feed.url) && databaseFeeds.length < 15) {
      databaseFeeds.push(feed);
      seenUrls.add(feed.url);
    }
  }
  
  // If we have enough feeds from database (10+), skip AI and return immediately
  if (databaseFeeds.length >= 10) {
    console.log(`[FastPath] ✅ Found ${databaseFeeds.length} feeds from database, skipping AI`);
    console.log(`[FastPath] Total time: ${Date.now() - fastPathStartTime}ms (saved ~3-4 seconds)`);
    
    // Cache the result
    if (config.isLocal && config.enableCache) {
      cache.set(cacheKey, databaseFeeds);
    }
    
    return {
      feeds: databaseFeeds.slice(0, 15), // Limit to 15 feeds
      newspaperName: generateNewspaperName(theme, locale),
    };
  }
  
  // If we have some feeds (5-9), use them but supplement with AI
  if (databaseFeeds.length >= 5) {
    console.log(`[FastPath] Found ${databaseFeeds.length} feeds from database, will supplement with AI`);
  } else {
    console.log(`[FastPath] Only ${databaseFeeds.length} feeds from database, will use AI as primary source`);
  }

  try {
    // Build prompt for feed suggestions
    const prompt = buildPrompt(theme, locale);
    console.log(`[Bedrock] Requesting feed suggestions for theme: "${theme}", locale: "${locale}"`);

    // Invoke Bedrock model (configurable via BEDROCK_MODEL_ID)
    // Default: Nova Micro (amazon.nova-micro-v1:0)
    // Rollback: Set BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
    
    const command = new InvokeModelCommand({
      modelId: config.bedrockModelIdLite, // Nova Lite for feed suggestions
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(buildBedrockRequest(prompt, config.bedrockModelIdLite)),
    });

    const startTime = Date.now();
    const response = await bedrockClient.send(command);
    const bedrockTime = Date.now() - startTime;
    console.log(`[Bedrock] API call completed in ${bedrockTime}ms`);
    
    // Extract token usage from response (if available)
    const tokenUsage = extractTokenUsage(response);
    
    // Log monitoring metrics for cost tracking
    logMonitoringMetrics({
      apiCallCount: 1,
      responseTimeMs: bedrockTime,
      inputTokens: tokenUsage?.inputTokens,
      outputTokens: tokenUsage?.outputTokens,
      totalTokens: tokenUsage?.totalTokens,
      modelId: config.bedrockModelIdLite,
      service: 'feedSuggestionService',
      operation: 'suggestFeeds',
      success: true,
    });
    
    // Parse response and log for debugging
    const content = parseBedrockResponse(response, config.bedrockModelIdLite);
    
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

    // OPTIMIZATION: Skip validation for feeds we already have from database
    // Only validate new feeds from AI
    const feedsToValidate: FeedSuggestion[] = [];
    const preValidatedFeeds: FeedSuggestion[] = [];
    const databaseUrls = new Set(databaseFeeds.map(f => f.url));
    
    for (const suggestion of uniqueSuggestions) {
      if (databaseUrls.has(suggestion.url)) {
        // Feed is already in database, skip validation
        preValidatedFeeds.push(suggestion);
      } else {
        // New feed from AI, needs validation
        feedsToValidate.push(suggestion);
      }
    }
    
    console.log(`[Validation] Skipping validation for ${preValidatedFeeds.length} database feeds`);
    console.log(`[Validation] Validating ${feedsToValidate.length} new AI feeds...`);

    // Validate only new feed URLs in parallel
    let validatedSuggestions: FeedSuggestion[] = [...preValidatedFeeds];
    
    if (feedsToValidate.length > 0) {
      const validationStartTime = Date.now();
      
      const validationResults = await Promise.all(
        feedsToValidate.map(async (suggestion) => ({
          suggestion,
          isValid: await validateFeedUrl(suggestion.url),
        }))
      );
      
      const validationTime = Date.now() - validationStartTime;
      console.log(`[Validation] Completed in ${validationTime}ms`);

      const newValidatedFeeds: FeedSuggestion[] = validationResults
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
      
      console.log(`[Validation] Result: ${newValidatedFeeds.length}/${feedsToValidate.length} new feeds are valid`);
      
      // Add newly validated feeds
      validatedSuggestions.push(...newValidatedFeeds);
    } else {
      console.log(`[Validation] No new feeds to validate, using ${preValidatedFeeds.length} database feeds`);
    }

    // Select top 14 feeds from validated suggestions (leave room for 1 default feed)
    const maxBedrockFeeds = 14;
    const topFeeds = validatedSuggestions.slice(0, maxBedrockFeeds);
    
    if (validatedSuggestions.length > maxBedrockFeeds) {
      console.log(`[Selection] Selected top ${maxBedrockFeeds} feeds from ${validatedSuggestions.length} valid feeds`);
    }

    // If we have 0 valid feeds from AI, use database feeds we already fetched
    if (topFeeds.length === 0) {
      console.log(`[Fallback] No valid feeds from Bedrock, using database feeds`);
      
      if (databaseFeeds.length > 0) {
        console.log(`[Fallback] Using ${databaseFeeds.length} feeds from database`);
        return {
          feeds: databaseFeeds.slice(0, 15), // Limit to 15 feeds
          newspaperName: generateNewspaperName(theme, locale),
        };
      }
      
      // If no database feeds, use default feeds
      console.log(`[Fallback] No database feeds, returning default feeds`);
      const defaultFeeds = getAllDefaultFeeds(locale);
      
      // Ensure we have at least 15 feeds by repeating if necessary
      const feedsToReturn: FeedSuggestion[] = [];
      while (feedsToReturn.length < 15) {
        const remainingNeeded = 15 - feedsToReturn.length;
        const feedsToAdd = defaultFeeds.slice(0, Math.min(remainingNeeded, defaultFeeds.length));
        feedsToReturn.push(...feedsToAdd.map(feed => ({ ...feed, isDefault: true })));
      }
      
      console.log(`[Fallback] Returning ${feedsToReturn.length} default feeds`);
      
      return {
        feeds: feedsToReturn,
        newspaperName: generateNewspaperName(theme, locale),
      };
    }
    
    // Merge AI feeds with database feeds (database feeds already fetched at the beginning)
    console.log(`[Merge] Combining ${topFeeds.length} AI feeds with ${databaseFeeds.length} database feeds`);
    
    // Add database feeds that are not already in AI results
    const existingUrls = new Set(topFeeds.map(s => s.url));
    const newDatabaseFeeds = databaseFeeds.filter(feed => !existingUrls.has(feed.url));
    
    if (newDatabaseFeeds.length > 0) {
      // Add database feeds at the beginning (highest priority)
      topFeeds.unshift(...newDatabaseFeeds);
      console.log(`[Merge] Added ${newDatabaseFeeds.length} database feeds at the beginning`);
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
    // Log monitoring metrics for failed API call
    logMonitoringMetrics({
      apiCallCount: 1,
      responseTimeMs: 0, // Unknown response time for failed calls
      modelId: config.bedrockModelIdLite,
      service: 'feedSuggestionService',
      operation: 'suggestFeeds',
      success: false,
      errorType: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    });
    
    logStructuredError(
      'feedSuggestionService',
      'API_ERROR',
      'Bedrock API error occurred',
      {
        theme,
        locale,
      },
      error,
      config.bedrockModelIdLite
    );
    
    // OPTIMIZATION: If AI fails, use database feeds as fallback
    console.log(`[Error] Bedrock API failed, using database feeds as fallback`);
    
    if (databaseFeeds.length > 0) {
      console.log(`[Fallback] Using ${databaseFeeds.length} feeds from database`);
      return {
        feeds: databaseFeeds.slice(0, 15),
        newspaperName: generateNewspaperName(theme, locale),
      };
    }
    
    // If no database feeds, use default feeds
    console.log(`[Fallback] No database feeds, returning default feeds`);
    const defaultFeeds = getAllDefaultFeeds(locale);
    
    return {
      feeds: defaultFeeds.slice(0, 15),
      newspaperName: generateNewspaperName(theme, locale),
    };
  }
}

/**
 * Build Bedrock request body based on model ID
 * Adapts request format for different models (Claude 3 Haiku vs Nova Micro)
 * 
 * @param prompt - User prompt text
 * @param modelId - Bedrock model ID
 * @returns Request body object
 */
function buildBedrockRequest(prompt: string, modelId: string): object {
  // Check if model is Claude 3 Haiku (Anthropic Messages API)
  if (modelId.includes('anthropic.claude')) {
    return {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    };
  }
  
  // Nova Micro (Messages API v1)
  return {
    messages: [
      {
        role: 'user',
        content: [
          {
            text: prompt,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 5000, // Nova Micro max tokens limit
      temperature: 0.7,
      topP: 0.9,
    },
  };
}

/**
 * Parse Bedrock response based on model format
 * Handles different response structures (Claude 3 Haiku vs Nova Micro)
 * 
 * @param response - Raw Bedrock API response
 * @param modelId - Bedrock model ID
 * @returns Extracted text content
 */
function parseBedrockResponse(response: any, modelId: string): string {
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  // Check if model is Claude 3 Haiku (Anthropic Messages API)
  if (modelId.includes('anthropic.claude')) {
    return responseBody.content[0].text;
  }
  
  // Nova Micro (Messages API v1)
  return responseBody.output.message.content[0].text;
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
    // Parse response using model-specific parser
    const content = parseBedrockResponse(response, config.bedrockModelIdLite);
    
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
      logStructuredError(
        'feedSuggestionService',
        'PARSE_ERROR',
        'No JSON found in response',
        { theme, locale },
        undefined,
        config.bedrockModelIdLite
      );
      throw new Error('No JSON found in response');
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (jsonError) {
      // If JSON parsing fails, try to fix common issues
      logStructuredError(
        'feedSuggestionService',
        'PARSE_ERROR',
        'JSON parse error, attempting to fix',
        { theme, locale, jsonLength: jsonString.length },
        jsonError,
        config.bedrockModelIdLite
      );
      
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
        logStructuredError(
          'feedSuggestionService',
          'PARSE_ERROR',
          'Cleaned JSON still failed to parse',
          { theme, locale },
          undefined,
          config.bedrockModelIdLite
        );
        
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
            logStructuredError(
              'feedSuggestionService',
              'PARSE_ERROR',
              'Failed to recover feeds from partial JSON',
              { theme, locale },
              recoveryError,
              config.bedrockModelIdLite
            );
            
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
              logStructuredError(
                'feedSuggestionService',
                'PARSE_ERROR',
                'Manual extraction failed',
                { theme, locale },
                manualError,
                config.bedrockModelIdLite
              );
              throw jsonError;
            }
          }
        } else {
          logStructuredError(
            'feedSuggestionService',
            'PARSE_ERROR',
            'Could not find feeds array in response',
            { theme, locale },
            undefined,
            config.bedrockModelIdLite
          );
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
    logStructuredError(
      'feedSuggestionService',
      'PARSE_ERROR',
      'Failed to parse AI response',
      { theme, locale },
      error,
      config.bedrockModelIdLite
    );
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
  
  // Return 15 generic feeds to meet Requirements 4.1 (minimum 15 feeds)
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
    {
      url: 'https://www.wired.com/feed/rss',
      title: 'Wired',
      reasoning: `Technology and innovation news related to the theme: ${theme}`,
    },
    {
      url: 'https://techcrunch.com/feed/',
      title: 'TechCrunch',
      reasoning: `Startup and technology news about the theme: ${theme}`,
    },
    {
      url: 'https://www.theverge.com/rss/index.xml',
      title: 'The Verge',
      reasoning: `Technology and culture coverage of the theme: ${theme}`,
    },
    {
      url: 'https://www.engadget.com/rss.xml',
      title: 'Engadget',
      reasoning: `Consumer electronics and technology news for the theme: ${theme}`,
    },
    {
      url: 'https://www.cnet.com/rss/news/',
      title: 'CNET News',
      reasoning: `Tech news and reviews related to the theme: ${theme}`,
    },
    {
      url: 'https://www.zdnet.com/news/rss.xml',
      title: 'ZDNet',
      reasoning: `Business technology news about the theme: ${theme}`,
    },
    {
      url: 'https://www.forbes.com/real-time/feed2/',
      title: 'Forbes',
      reasoning: `Business and finance news related to the theme: ${theme}`,
    },
    {
      url: 'https://www.bloomberg.com/feed/podcast/etf-report.xml',
      title: 'Bloomberg',
      reasoning: `Financial and business news about the theme: ${theme}`,
    },
    {
      url: 'https://www.wsj.com/xml/rss/3_7085.xml',
      title: 'Wall Street Journal',
      reasoning: `Business and financial coverage of the theme: ${theme}`,
    },
    {
      url: 'https://www.economist.com/rss',
      title: 'The Economist',
      reasoning: `Global economic and political analysis of the theme: ${theme}`,
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


