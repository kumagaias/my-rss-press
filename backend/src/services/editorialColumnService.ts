/**
 * Editorial Column Service
 * 
 * Generates AI-powered editorial columns in the style of traditional
 * newspaper editorials.
 * 
 * Features:
 * - Weaves together article themes with historical/philosophical insights
 * - Supports English and Japanese
 * - 150-200 words (concise and impactful)
 * - Uses AWS Bedrock (Nova Micro by default, Claude 3 Haiku for rollback)
 * - Configurable model via BEDROCK_MODEL_ID environment variable
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';
import type { Article } from './rssFetcherService.js';
import { logStructuredError, logStructuredWarning, logMonitoringMetrics, extractTokenUsage } from '../utils/structuredLogger.js';

// Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: config.bedrockRegion,
});

export interface EditorialColumnOptions {
  articles: Article[];
  theme: string;
  locale: 'en' | 'ja';
  maxRetries?: number;
}

export interface EditorialColumnResult {
  column: string;
  title: string;
}

/**
 * Build prompt for editorial column generation
 * 
 * @param articles - Articles to weave into the column
 * @param theme - Newspaper theme
 * @param locale - Language locale
 * @returns Prompt string
 */
function buildEditorialPrompt(
  articles: Article[],
  theme: string,
  locale: 'en' | 'ja'
): string {
  // Prepare article summaries with more detail (max 5 articles for focused context)
  const articleSummaries = articles
    .slice(0, 5)
    .map((a, i) => `${i + 1}. ${a.title}\n   ${a.description.substring(0, 150)}...`)
    .join('\n\n');

  if (locale === 'ja') {
    return `あなたは伝統的な新聞コラムを書く思慮深いコラムニストです。

以下の記事の内容を踏まえて、簡潔なコラム（200〜250文字）を書いてください：

【重要な指示】
1. 記事の具体的な内容やトピックに言及すること
2. 記事から読み取れる現代社会の課題や傾向を考察する
3. 歴史的な視点や哲学的な洞察を加える
4. 読者に考えさせる問いかけや示唆で締めくくる
5. 必ず200〜250文字以内に収めること

テーマ: ${theme}

記事の内容:
${articleSummaries}

日本語でコラムを書いてください。記事の具体的な内容に触れながら、より広い視点で考察してください。

形式:
タイトル: [記事の内容を反映した示唆に富むタイトル]
コラム: [200〜250文字のコラム内容]`;
  }

  // English prompt
  return `You are a thoughtful editorial columnist writing in the style of traditional newspaper editorials.

Your task is to write a brief editorial column (100-150 words) that:

【Important Instructions】
1. Reference specific content and topics from the articles
2. Reflect on contemporary issues or trends revealed in the articles
3. Add historical perspective or philosophical insight
4. End with a thought-provoking question or suggestion
5. Keep it strictly within 100-150 words

Theme: ${theme}

Article content:
${articleSummaries}

Write the editorial column in English. Reference the specific article content while providing broader perspective and insight.

Format:
Title: [A thought-provoking title reflecting the article content]
Column: [100-150 words of editorial content]`;
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
      max_tokens: 400, // Enough for 100-150 words (EN) or 200-250 chars (JP)
      messages: [{ role: 'user', content: prompt }],
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
      maxTokens: 400, // Enough for 100-150 words (EN) or 200-250 chars (JP)
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
 * @returns Response text content
 */
function parseBedrockResponse(response: any, modelId: string): string | null {
  try {
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Check if model is Claude 3 Haiku (Anthropic Messages API)
    if (modelId.includes('anthropic.claude')) {
      return responseBody.content?.[0]?.text?.trim() || null;
    }
    
    // Nova Micro (Messages API v1)
    return responseBody.output?.message?.content?.[0]?.text?.trim() || null;
  } catch (error) {
    logStructuredError(
      'editorialColumnService',
      'PARSE_ERROR',
      'Error parsing Bedrock response',
      {},
      error,
      modelId
    );
    return null;
  }
}

/**
 * Parse editorial column response from Bedrock
 * 
 * Expected format:
 * Title: [title text]
 * Column: [column text]
 * 
 * @param responseText - Raw response from Bedrock
 * @returns Parsed title and column, or null if parsing fails
 */
function parseEditorialResponse(responseText: string): EditorialColumnResult | null {
  try {
    // Try to extract title and column using regex (support both English and Japanese labels)
    const titleMatch = responseText.match(/(?:Title|タイトル):\s*(.+?)(?:\n|$)/i);
    const columnMatch = responseText.match(/(?:Column|コラム):\s*(.+)/is);

    if (titleMatch && columnMatch) {
      return {
        title: titleMatch[1].trim(),
        column: columnMatch[1].trim(),
      };
    }

    // Fallback: If format doesn't match, try splitting by newlines
    const lines = responseText.trim().split('\n');
    if (lines.length >= 2) {
      // First line as title, rest as column
      return {
        title: lines[0].replace(/^(Title:|タイトル:)\s*/i, '').trim(),
        column: lines.slice(1).join('\n').replace(/^(Column:|コラム:)\s*/i, '').trim(),
      };
    }

    logStructuredWarning(
      'editorialColumnService',
      'Failed to parse response format',
      {},
      config.bedrockModelIdLite
    );
    return null;
  } catch (error) {
    logStructuredError(
      'editorialColumnService',
      'PARSE_ERROR',
      'Error parsing response',
      {},
      error,
      config.bedrockModelIdLite
    );
    return null;
  }
}

/**
 * Generate editorial column using Bedrock
 * 
 * @param options - Column generation options
 * @returns Editorial column text and title, or null if generation fails
 */
export async function generateEditorialColumn(
  options: EditorialColumnOptions
): Promise<EditorialColumnResult | null> {
  const { articles, theme, locale, maxRetries = 1 } = options; // Reduced from 2 to 1

  // Validate inputs
  if (!articles || articles.length === 0) {
    logStructuredWarning(
      'editorialColumnService',
      'No articles provided',
      { theme, locale },
      config.bedrockModelIdLite
    );
    return null;
  }

  console.log(`[Editorial Column] Generating column for theme: ${theme}, locale: ${locale}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Build prompt
      const prompt = buildEditorialPrompt(articles, theme, locale);

      // Call Bedrock API (configurable via BEDROCK_MODEL_ID_LITE)
      // Default: Nova Lite (amazon.nova-lite-v1:0)
      // Rollback: Set BEDROCK_MODEL_ID_LITE=anthropic.claude-3-haiku-20240307-v1:0
      const command = new InvokeModelCommand({
        modelId: config.bedrockModelIdLite,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(buildBedrockRequest(prompt, config.bedrockModelIdLite)),
      });

      // Execute with timeout (10 seconds for async generation)
      const startTime = Date.now();
      const response = await Promise.race([
        bedrockClient.send(command),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Bedrock API timeout')), 10000)
        ),
      ]);
      const responseTime = Date.now() - startTime;

      // Parse response using model-specific parser
      const responseText = parseBedrockResponse(response, config.bedrockModelIdLite);
      
      // Extract token usage from response (if available)
      const responseBody = JSON.parse(new TextDecoder().decode((response as any).body));
      const tokenUsage = extractTokenUsage(responseBody);
      
      // Log monitoring metrics for cost tracking
      logMonitoringMetrics({
        apiCallCount: 1,
        responseTimeMs: responseTime,
        inputTokens: tokenUsage?.inputTokens,
        outputTokens: tokenUsage?.outputTokens,
        totalTokens: tokenUsage?.totalTokens,
        modelId: config.bedrockModelIdLite,
        service: 'editorialColumnService',
        operation: 'generateEditorialColumn',
        success: true,
      });

      if (!responseText) {
        logStructuredWarning(
          'editorialColumnService',
          'Empty response from Bedrock',
          { theme, locale, attempt, maxRetries },
          config.bedrockModelIdLite
        );
        
        // Retry on empty response
        if (attempt < maxRetries) {
          console.log(`[Editorial Column] Retrying (${attempt}/${maxRetries})...`);
          continue;
        }
        
        return null;
      }

      // Parse title and column
      const result = parseEditorialResponse(responseText);
      
      if (!result) {
        logStructuredWarning(
          'editorialColumnService',
          'Failed to parse response',
          { theme, locale, attempt, maxRetries },
          config.bedrockModelIdLite
        );
        
        // Retry on parse failure
        if (attempt < maxRetries) {
          console.log(`[Editorial Column] Retrying (${attempt}/${maxRetries})...`);
          continue;
        }
        
        return null;
      }

      console.log(`[Editorial Column] Generated column: ${result.title}`);
      return result;
    } catch (error) {
      // Log monitoring metrics for failed API call
      logMonitoringMetrics({
        apiCallCount: 1,
        responseTimeMs: 0, // Unknown response time for failed calls
        modelId: config.bedrockModelIdLite,
        service: 'editorialColumnService',
        operation: 'generateEditorialColumn',
        success: false,
        errorType: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
      });
      
      logStructuredError(
        'editorialColumnService',
        'API_ERROR',
        `Generation failed (attempt ${attempt}/${maxRetries})`,
        { theme, locale, attempt, maxRetries, articleCount: articles.length },
        error,
        config.bedrockModelIdLite
      );

      // If this is the last attempt, return null
      if (attempt === maxRetries) {
        return null;
      }

      // Exponential backoff: 1s, 2s
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`[Editorial Column] Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
}
