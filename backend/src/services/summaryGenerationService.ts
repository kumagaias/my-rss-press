/**
 * Summary Generation Service
 * 
 * Generates newspaper summaries using AWS Bedrock (Claude 3 Haiku)
 * Summary language is determined by the newspaper's detected languages
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';
import { DEFAULT_LANGUAGE } from '../constants.js';
import type { Article } from './rssFetcherService.js';
import { logStructuredError, logStructuredWarning, logMonitoringMetrics, extractTokenUsage } from '../utils/structuredLogger.js';

// Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: config.bedrockRegion,
});

/**
 * Determine summary language based on detected languages
 * 
 * Priority:
 * 1. If only JP detected -> Japanese
 * 2. If only EN detected -> English
 * 3. If both or neither -> English (default)
 * 
 * @param languages - Array of detected language codes (e.g., ["JP", "EN"])
 * @returns Language code for summary ('ja' or 'en')
 */
export function determineSummaryLanguage(languages: string[]): 'ja' | 'en' {
  if (languages.length === 0) {
    return DEFAULT_LANGUAGE.LOCALE;
  }

  const hasJP = languages.includes('JP');
  const hasEN = languages.includes('EN');

  // If only Japanese, use Japanese
  if (hasJP && !hasEN) {
    return 'ja';
  }

  // Otherwise, use English (including mixed languages)
  return 'en';
}

/**
 * Generate a summary of the newspaper using Bedrock
 * 
 * @param articles - Array of articles to summarize
 * @param theme - Theme of the newspaper
 * @param languages - Detected languages (e.g., ["JP", "EN"])
 * @returns Summary text (100-200 characters, 3 lines) or null if generation fails
 */
export async function generateSummary(
  articles: Article[],
  theme: string,
  languages: string[]
): Promise<string | null> {
  try {
    // Determine summary language
    const summaryLanguage = determineSummaryLanguage(languages);

    // Use mock mode if enabled (for offline development or testing)
    if (config.useMockBedrock) {
      console.log('Using mock summary generation');
      return getMockSummary(theme, summaryLanguage);
    }

    // Prepare article titles for context (max 10 articles)
    const articleTitles = articles
      .slice(0, 10)
      .map((a, i) => `${i + 1}. ${a.title}`)
      .join('\n');

    // Create prompt based on language
    const prompt = summaryLanguage === 'ja'
      ? `以下は「${theme}」をテーマにした新聞の記事タイトルです。この新聞の内容を3行（100-200文字）で要約してください。

記事タイトル:
${articleTitles}

要約（3行、100-200文字）:`
      : `The following are article titles from a newspaper themed "${theme}". Please summarize the content of this newspaper in 3 lines (100-200 characters).

Article titles:
${articleTitles}

Summary (3 lines, 100-200 characters):`;

    // Call Bedrock API with timeout
    // Invoke Bedrock model (configurable via BEDROCK_MODEL_ID_MICRO)
    // Default: Nova Micro (amazon.nova-micro-v1:0)
    // Rollback: Set BEDROCK_MODEL_ID_MICRO=anthropic.claude-3-haiku-20240307-v1:0
    const command = new InvokeModelCommand({
      modelId: config.bedrockModelIdMicro,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(buildBedrockRequest(prompt, config.bedrockModelIdMicro)),
    });

    // Execute with timeout (10 seconds)
    const startTime = Date.now();
    const response = await Promise.race([
      bedrockClient.send(command),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Bedrock API timeout')), 10000)
      ),
    ]);
    const responseTime = Date.now() - startTime;

    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode((response as any).body));
    
    // Extract token usage from response (if available)
    const tokenUsage = extractTokenUsage(responseBody);
    
    // Log monitoring metrics for cost tracking
    logMonitoringMetrics({
      apiCallCount: 1,
      responseTimeMs: responseTime,
      inputTokens: tokenUsage?.inputTokens,
      outputTokens: tokenUsage?.outputTokens,
      totalTokens: tokenUsage?.totalTokens,
      modelId: config.bedrockModelIdMicro,
      service: 'summaryGenerationService',
      operation: 'generateSummary',
      success: true,
    });
    
    const summary = parseBedrockResponse(responseBody, config.bedrockModelIdMicro)?.trim();

    if (!summary) {
      logStructuredWarning(
        'summaryGenerationService',
        'Empty summary from Bedrock',
        { theme, languages, articleCount: articles.length },
        config.bedrockModelIdMicro
      );
      return null;
    }

    console.log(`Generated summary (${summaryLanguage}): ${summary.substring(0, 50)}...`);
    return summary;
  } catch (error) {
    // Log monitoring metrics for failed API call
    logMonitoringMetrics({
      apiCallCount: 1,
      responseTimeMs: 0, // Unknown response time for failed calls
      modelId: config.bedrockModelIdMicro,
      service: 'summaryGenerationService',
      operation: 'generateSummary',
      success: false,
      errorType: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
    });
    
    logStructuredError(
      'summaryGenerationService',
      'API_ERROR',
      'Error generating summary',
      { theme, languages, articleCount: articles.length },
      error,
      config.bedrockModelIdMicro
    );
    return null; // Return null on failure, don't throw
  }
}

/**
 * Generate mock summary for testing and offline development
 * @param theme - Theme of the newspaper
 * @param language - Language code ('ja' or 'en')
 * @returns Mock summary (100-200 characters, 3 lines)
 */
function getMockSummary(theme: string, language: 'ja' | 'en'): string {
  if (language === 'ja') {
    // Japanese mock summary (100-200 characters, 3 lines)
    // Each line is approximately 33-40 characters to reach 100-120 total
    return `${theme}に関する最新ニュースと重要なトピックをお届けします。業界の最新動向や注目の話題を詳しく解説しています。\n今後の展開や将来の見通しについても分析を加えています。専門家の意見や市場の反応も紹介しています。\n読者の皆様に役立つ情報を分かりやすくまとめました。`;
  } else {
    // English mock summary (100-200 characters, 3 lines)
    // Approximately 120-150 characters total
    return `Latest news about ${theme} with detailed analysis.\nKey developments and trending topics covered.\nStay informed with complete coverage.`;
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
      max_tokens: 300, // Enough for 100-200 characters
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
      maxTokens: 300, // Enough for 100-200 characters
      temperature: 0.7,
      topP: 0.9,
    },
  };
}

/**
 * Parse Bedrock response based on model format
 * Handles different response structures (Claude 3 Haiku vs Nova Micro)
 * 
 * @param responseBody - Parsed response body from Bedrock API
 * @param modelId - Bedrock model ID
 * @returns Extracted text content or null if not found
 */
function parseBedrockResponse(responseBody: any, modelId: string): string | null {
  try {
    // Check if model is Claude 3 Haiku (Anthropic Messages API)
    if (modelId.includes('anthropic.claude')) {
      return responseBody.content?.[0]?.text || null;
    }
    
    // Nova Micro (Messages API v1)
    return responseBody.output?.message?.content?.[0]?.text || null;
  } catch (error) {
    logStructuredError(
      'summaryGenerationService',
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
 * Generate summary with retry logic
 * 
 * @param articles - Array of articles to summarize
 * @param theme - Theme of the newspaper
 * @param languages - Detected languages
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Summary text or null if all retries fail
 */
export async function generateSummaryWithRetry(
  articles: Article[],
  theme: string,
  languages: string[],
  maxRetries: number = 3
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const summary = await generateSummary(articles, theme, languages);
      if (summary) {
        return summary;
      }

      // If summary is null but no error, don't retry
      console.log(`Summary generation returned null (attempt ${attempt}/${maxRetries})`);
      return null;
    } catch (error) {
      logStructuredError(
        'summaryGenerationService',
        'API_ERROR',
        `Summary generation failed (attempt ${attempt}/${maxRetries})`,
        { attempt, maxRetries },
        error,
        config.bedrockModelIdMicro
      );

      // If this is the last attempt, return null
      if (attempt === maxRetries) {
        return null;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return null;
}
