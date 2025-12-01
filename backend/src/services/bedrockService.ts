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
 * Suggest RSS feeds based on user theme using AWS Bedrock (Claude 3.5 Haiku)
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

    // Invoke Bedrock model
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
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

    // Cache the result in local development
    if (config.isLocal && config.enableCache) {
      cache.set(theme, suggestions);
    }

    return suggestions;
  } catch (error) {
    console.error('Bedrock API error:', error);
    // Fallback to default feeds on error
    return getDefaultFeedSuggestions(theme);
  }
}

/**
 * Build prompt for AI feed suggestions
 */
function buildPrompt(theme: string): string {
  return `ユーザーが「${theme}」に興味があります。関連するRSSフィードを3つ提案してください。

各フィードについて、以下の情報をJSON形式で返してください：
- url: RSSフィードのURL
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

実際に存在する、アクセス可能なRSSフィードのURLを提案してください。`;
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

    // Validate and return suggestions
    return feeds.slice(0, 3).map((feed: any) => ({
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
      url: 'https://news.ycombinator.com/rss',
      title: 'Hacker News',
      reasoning: `${theme}に関連する技術ニュースとディスカッション`,
    },
    {
      url: 'https://techcrunch.com/feed/',
      title: 'TechCrunch',
      reasoning: `${theme}のスタートアップとイノベーションニュース`,
    },
    {
      url: 'https://www.theverge.com/rss/index.xml',
      title: 'The Verge',
      reasoning: `${theme}に関するテクノロジーとカルチャーの記事`,
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
