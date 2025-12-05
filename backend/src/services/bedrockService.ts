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
}

/**
 * Validate if a feed URL is accessible
 */
async function validateFeedUrl(url: string): Promise<boolean> {
  try {
    // Try HEAD request first
    const headResponse = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyRSSPress/1.0; +https://my-rss-press.com)',
      },
      signal: AbortSignal.timeout(5000),
    });
    
    if (headResponse.ok) {
      return true;
    }
    
    // If HEAD fails, try GET (some servers don't support HEAD)
    const getResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyRSSPress/1.0; +https://my-rss-press.com)',
      },
      signal: AbortSignal.timeout(5000),
    });
    
    return getResponse.ok;
  } catch (error) {
    console.log(`Feed URL validation failed for ${url}:`, error);
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
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const response = await bedrockClient.send(command);
    const suggestions = parseAIResponse(response);

    // Validate feed URLs in parallel for better performance
    const validationResults = await Promise.all(
      suggestions.map(async (suggestion) => ({
        suggestion,
        isValid: await validateFeedUrl(suggestion.url),
      }))
    );

    const validatedSuggestions: FeedSuggestion[] = validationResults
      .filter(result => {
        if (!result.isValid) {
          console.log(`Skipping invalid feed URL: ${result.suggestion.url}`);
        }
        return result.isValid;
      })
      .map(result => result.suggestion);

    // If we have less than 5 valid feeds, supplement with defaults
    if (validatedSuggestions.length < 5) {
      console.log(`Only ${validatedSuggestions.length} valid feeds found, supplementing with defaults`);
      const defaultFeeds = getDefaultFeedSuggestions(theme);
      
      // Add default feeds that aren't already in the list
      const existingUrls = new Set(validatedSuggestions.map(s => s.url));
      for (const defaultFeed of defaultFeeds) {
        if (!existingUrls.has(defaultFeed.url) && validatedSuggestions.length < 10) {
          validatedSuggestions.push(defaultFeed);
        }
      }
    }

    // Cache the result in local development
    if (config.isLocal && config.enableCache) {
      cache.set(cacheKey, validatedSuggestions);
    }

    return validatedSuggestions;
  } catch (error) {
    console.error('Bedrock API error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    // Fallback to default feeds on error
    return getDefaultFeedSuggestions(theme);
  }
}

/**
 * Build prompt for AI feed suggestions
 */
function buildPrompt(theme: string, locale: 'en' | 'ja' = 'en'): string {
  if (locale === 'ja') {
    return `ユーザーが「${theme}」に興味があります。関連する日本語のRSSフィードを10個提案してください。

重要な制約：
1. 実際に存在し、現在もアクティブな日本語のRSSフィードのURLのみを提案してください
2. 日本のメディア、ブログ、ニュースサイトを優先してください
3. 架空のURLや存在しないフィードは絶対に提案しないでください
4. 大手メディアや公式サイトの確実にアクセス可能なフィードを優先してください
5. フィードURLは必ず /rss、/feed、/rss.xml、/feed.xml、/index.xml などで終わる正しい形式にしてください
6. テーマとの関連度が高い順に並べてください（最も関連度が高いものを最初に）

各フィードについて、以下の情報をJSON形式で返してください：
- url: RSSフィードのURL（必ず実在する日本語のもの）
- title: フィードの名前（日本語）
- reasoning: なぜこのフィードを提案するのか（日本語で1-2文）

レスポンス形式：
{
  "feeds": [
    {
      "url": "https://example.jp/feed",
      "title": "サンプルフィード",
      "reasoning": "このフィードは${theme}に関する最新情報を日本語で提供します"
    }
  ]
}

日本語フィードの例：
- 技術系: https://www.itmedia.co.jp/rss/2.0/news_bursts.xml, https://japan.cnet.com/rss/index.rdf
- ニュース: https://www3.nhk.or.jp/rss/news/cat0.xml, https://news.yahoo.co.jp/rss/topics/top-picks.xml
- ブログ: https://blog.example.jp/feed/

必ず実在する、アクセス可能な日本語のRSSフィードのURLを提案してください。`;
  } else {
    return `The user is interested in "${theme}". Please suggest 10 related RSS feeds.

CRITICAL LANGUAGE REQUIREMENT: 
- You MUST write ALL text in English
- Feed titles MUST be in English
- Reasoning MUST be in English  
- DO NOT use Japanese characters (日本語) or any other language
- If the feed is from a non-English source, translate the title to English

Important constraints:
1. Only suggest RSS feed URLs that actually exist and are currently active
2. Prioritize English-language media, blogs, and news sites
3. Never suggest fictional or non-existent feed URLs
4. Prioritize reliable feeds from major media outlets and official websites
5. Feed URLs must end with proper formats like /rss, /feed, /rss.xml, /feed.xml, /index.xml
6. Sort by relevance to the theme (most relevant first)

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

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const feeds = parsed.feeds || [];

    // Validate and return suggestions (up to 10)
    return feeds.slice(0, 10).map((feed: any) => ({
      url: feed.url || '',
      title: feed.title || 'Unknown Feed',
      reasoning: feed.reasoning || '',
    }));
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw error;
  }
}

/**
 * Get mock feed suggestions for offline development
 */
function getMockFeedSuggestions(theme: string): FeedSuggestion[] {
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
      url: 'https://feeds.theguardian.com/theguardian/world/rss',
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
