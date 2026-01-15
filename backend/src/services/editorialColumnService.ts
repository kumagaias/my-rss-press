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
 * - Uses AWS Bedrock (Claude 3 Haiku)
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';
import type { Article } from './rssFetcherService.js';

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

    console.error('[Editorial Column] Failed to parse response format');
    return null;
  } catch (error) {
    console.error('[Editorial Column] Error parsing response:', error);
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
    console.error('[Editorial Column] No articles provided');
    return null;
  }

  console.log(`[Editorial Column] Generating column for theme: ${theme}, locale: ${locale}`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Build prompt
      const prompt = buildEditorialPrompt(articles, theme, locale);

      // Call Bedrock API
      const command = new InvokeModelCommand({
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 400, // Enough for 100-150 words (EN) or 200-250 chars (JP)
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      // Execute with timeout (10 seconds for async generation)
      const response = await Promise.race([
        bedrockClient.send(command),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Bedrock API timeout')), 10000)
        ),
      ]);

      // Parse response
      const responseBody = JSON.parse(new TextDecoder().decode((response as any).body));
      const responseText = responseBody.content?.[0]?.text?.trim();

      if (!responseText) {
        console.error('[Editorial Column] Empty response from Bedrock');
        
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
        console.error('[Editorial Column] Failed to parse response');
        
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
      console.error(`[Editorial Column] Generation failed (attempt ${attempt}/${maxRetries}):`, error);

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
