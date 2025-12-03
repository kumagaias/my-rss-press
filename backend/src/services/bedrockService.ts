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
 * @returns Array of feed suggestions
 */
export async function suggestFeeds(theme: string): Promise<FeedSuggestion[]> {
  // Check cache in local development mode
  if (config.isLocal && config.enableCache) {
    const cached = cache.get(theme);
    if (cached) {
      console.log('Using cached Bedrock response for theme:', theme);
      return cached;
    }
  }

  // Use mock mode if enabled (for offline development)
  if (config.useMockBedrock) {
    console.log('Using mock Bedrock response for theme:', theme);
    return getMockFeedSuggestions(theme);
  }

  try {
    // Build prompt for feed suggestions
    const prompt = buildPrompt(theme);

    // Invoke Bedrock model (using Claude 3 Haiku - most cost-effective)
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1024,
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

    // Validate feed URLs
    const validatedSuggestions: FeedSuggestion[] = [];
    for (const suggestion of suggestions) {
      const isValid = await validateFeedUrl(suggestion.url);
      if (isValid) {
        validatedSuggestions.push(suggestion);
      } else {
        console.log(`Skipping invalid feed URL: ${suggestion.url}`);
      }
    }

    // If no valid feeds found, return default suggestions
    if (validatedSuggestions.length === 0) {
      console.log('No valid feeds found, using default suggestions');
      return getDefaultFeedSuggestions(theme);
    }

    // Cache the result in local development
    if (config.isLocal && config.enableCache) {
      cache.set(theme, validatedSuggestions);
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
function buildPrompt(theme: string): string {
  return `ユーザーが「${theme}」に興味があります。関連するRSSフィードを10個提案してください。

重要な制約：
1. 実際に存在し、現在もアクティブなRSSフィードのURLのみを提案してください
2. 架空のURLや存在しないフィードは絶対に提案しないでください
3. 大手メディアや公式サイトの確実にアクセス可能なフィードを優先してください
4. フィードURLは必ず /rss、/feed、/rss.xml、/feed.xml などで終わる正しい形式にしてください

各フィードについて、以下の情報をJSON形式で返してください：
- url: RSSフィードのURL（必ず実在するもの）
- title: フィードの名前
- reasoning: なぜこのフィードを提案するのか（1-2文）

レスポンス形式：
{
  "feeds": [
    {
      "url": "https://example.com/feed",
      "title": "Example Feed",
      "reasoning": "このフィードは${theme}に関する最新情報を提供します"
    }
  ]
}

例：
- 技術系: https://news.ycombinator.com/rss, https://techcrunch.com/feed/
- ニュース: https://feeds.bbci.co.uk/news/rss.xml, https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml
- ブログ: https://blog.example.com/feed/

必ず実在する、アクセス可能なRSSフィードのURLを提案してください。`;
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
      url: 'https://feeds.washingtonpost.com/rss/world',
      title: 'Washington Post World',
      reasoning: `International news related to the theme: ${theme}`,
    },
    {
      url: 'https://feeds.theguardian.com/theguardian/world/rss',
      title: 'The Guardian World News',
      reasoning: `Global perspective on the theme: ${theme}`,
    },
    {
      url: 'https://www.aljazeera.com/xml/rss/all.xml',
      title: 'Al Jazeera',
      reasoning: `Middle Eastern perspective on the theme: ${theme}`,
    },
    {
      url: 'https://feeds.npr.org/1001/rss.xml',
      title: 'NPR News',
      reasoning: `Public radio coverage of the theme: ${theme}`,
    },
    {
      url: 'https://feeds.feedburner.com/time/topstories',
      title: 'TIME Top Stories',
      reasoning: `Magazine-style coverage of the theme: ${theme}`,
    },
    {
      url: 'https://www.economist.com/rss',
      title: 'The Economist',
      reasoning: `Economic and business analysis of the theme: ${theme}`,
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
