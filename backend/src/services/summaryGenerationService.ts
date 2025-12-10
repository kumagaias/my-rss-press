/**
 * Summary Generation Service
 * 
 * Generates newspaper summaries using AWS Bedrock (Claude 3 Haiku)
 * Summary language is determined by the newspaper's detected languages
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';
import type { Article } from './rssFetcherService.js';

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
    return 'en'; // Default to English
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
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 300, // Enough for 100-200 characters
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    // Execute with timeout (10 seconds)
    const response = await Promise.race([
      bedrockClient.send(command),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Bedrock API timeout')), 10000)
      ),
    ]);

    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode((response as any).body));
    const summary = responseBody.content?.[0]?.text?.trim();

    if (!summary) {
      console.error('Empty summary from Bedrock');
      return null;
    }

    console.log(`Generated summary (${summaryLanguage}): ${summary.substring(0, 50)}...`);
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    return null; // Return null on failure, don't throw
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
      console.error(`Summary generation failed (attempt ${attempt}/${maxRetries}):`, error);

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
