import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';
import { logStructuredError, logMonitoringMetrics, extractTokenUsage } from '../utils/structuredLogger.js';

// Bedrock client configuration
const bedrockClient = new BedrockRuntimeClient({
  region: config.bedrockRegion,
});

export interface Article {
  title: string;
  description?: string;
  link: string;
  pubDate: Date;
  imageUrl?: string;
  feedSource: string;
  importance?: number;
}

// Removed unused interface - keeping for future use if needed
// interface ArticleRelevanceResult {
//   relevantIndices: number[];
//   totalArticles: number;
//   filteredCount: number;
// }

/**
 * Filter articles by theme relevance using batch AI judgment
 * @param articles - Articles to filter
 * @param theme - User's theme keyword
 * @param locale - Language for prompt
 * @param minThreshold - Minimum relevance threshold (default: 0.3)
 * @returns Filtered articles
 */
export async function filterArticlesByTheme(
  articles: Article[],
  theme: string,
  locale: 'en' | 'ja' = 'en',
  _minThreshold: number = 0.3 // Prefix with _ to indicate intentionally unused
): Promise<Article[]> {
  // If too few articles, don't filter
  if (articles.length < 8) {
    console.log(`[Article Filter] Too few articles (${articles.length}), skipping filter`);
    return articles;
  }

  try {
    // Build prompt for batch judgment
    const prompt = buildFilterPrompt(articles, theme, locale);
    
    console.log(`[Article Filter] Filtering ${articles.length} articles for theme: "${theme}"`);
    
    // Call Bedrock for batch judgment
    const result = await callBedrockForFiltering(prompt);
    
    // Parse response
    const relevantIndices = parseFilterResponse(result);
    
    // Filter articles
    const filteredArticles = relevantIndices
      .filter(i => i >= 0 && i < articles.length)
      .map(i => articles[i]);
    
    console.log(`[Article Filter] Filtered: ${filteredArticles.length}/${articles.length} articles relevant`);
    
    // If too few articles after filtering, return all
    if (filteredArticles.length < 8) {
      console.log(`[Article Filter] Too few filtered articles (${filteredArticles.length}), returning all`);
      return articles;
    }
    
    return filteredArticles;
  } catch (error) {
    // Log monitoring metrics for failed API call
    logMonitoringMetrics({
      apiCallCount: 1,
      responseTimeMs: 0, // Unknown response time for failed calls
      modelId: config.bedrockModelIdMicro,
      service: 'articleFilterService',
      operation: 'filterArticlesByTheme',
      success: false,
      errorType: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    });
    
    logStructuredError(
      'articleFilterService',
      'API_ERROR',
      'Filtering failed, returning all articles',
      { theme, locale, articleCount: articles.length },
      error,
      config.bedrockModelIdMicro
    );
    return articles; // Fallback: return all articles
  }
}

/**
 * Build prompt for batch article filtering
 */
function buildFilterPrompt(
  articles: Article[],
  theme: string,
  locale: 'en' | 'ja'
): string {
  const articleList = articles
    .map((a, i) => `${i}. ${a.title}`)
    .join('\n');
  
  if (locale === 'ja') {
    return `テーマ: ${theme}

以下の記事のうち、テーマに関連する記事のインデックス番号を配列で返してください。
関連性が低い記事は除外してください。

記事リスト:
${articleList}

JSON形式で返してください（説明不要）:
{ "relevantIndices": [0, 3, 5, ...] }`;
  } else {
    return `Theme: ${theme}

From the following articles, return the index numbers of articles related to the theme.
Exclude articles with low relevance.

Article list:
${articleList}

Return in JSON format (no explanation):
{ "relevantIndices": [0, 3, 5, ...] }`;
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
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, // Lower temperature for more consistent filtering
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
      maxTokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent filtering
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
 * @returns Parsed response with content array
 */
function parseBedrockResponse(response: any, modelId: string): {
  content: Array<{ text: string }>;
} {
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  // Check if model is Claude 3 Haiku (Anthropic Messages API)
  if (modelId.includes('anthropic.claude')) {
    return responseBody;
  }
  
  // Nova Micro (Messages API v1) - adapt to Claude format
  return {
    content: [
      {
        text: responseBody.output.message.content[0].text,
      },
    ],
  };
}

/**
 * Call Bedrock for article filtering
 * Uses configurable model ID (Nova Micro by default, Claude 3 Haiku for rollback)
 */
async function callBedrockForFiltering(prompt: string): Promise<{
  content: Array<{ text: string }>;
}> {
  // Invoke Bedrock model (configurable via BEDROCK_MODEL_ID_MICRO)
  // Default: Nova Micro (amazon.nova-micro-v1:0)
  // Rollback: Set BEDROCK_MODEL_ID_MICRO=anthropic.claude-3-haiku-20240307-v1:0
  
  const command = new InvokeModelCommand({
    modelId: config.bedrockModelIdMicro,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(buildBedrockRequest(prompt, config.bedrockModelIdMicro)),
  });
  
  const startTime = Date.now();
  const response = await bedrockClient.send(command);
  const responseTime = Date.now() - startTime;
  
  const parsedResponse = parseBedrockResponse(response, config.bedrockModelIdMicro);
  
  // Extract token usage from response (if available)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const tokenUsage = extractTokenUsage(responseBody);
  
  // Log monitoring metrics for cost tracking
  logMonitoringMetrics({
    apiCallCount: 1,
    responseTimeMs: responseTime,
    inputTokens: tokenUsage?.inputTokens,
    outputTokens: tokenUsage?.outputTokens,
    totalTokens: tokenUsage?.totalTokens,
    modelId: config.bedrockModelIdMicro,
    service: 'articleFilterService',
    operation: 'filterArticlesByTheme',
    success: true,
  });
  
  return parsedResponse;
}

/**
 * Parse Bedrock response to extract relevant article indices
 */
function parseFilterResponse(response: {
  content: Array<{ text: string }>;
}): number[] {
  try {
    const content = response.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.relevantIndices || [];
  } catch (error) {
    logStructuredError(
      'articleFilterService',
      'PARSE_ERROR',
      'Failed to parse response',
      {},
      error,
      config.bedrockModelIdMicro
    );
    throw error;
  }
}
