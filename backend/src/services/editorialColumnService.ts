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
  // Prepare article summaries (max 8 articles for context)
  const articleSummaries = articles
    .slice(0, 8)
    .map((a, i) => `${i + 1}. ${a.title}`)
    .join('\n');

  if (locale === 'ja') {
    return `あなたは伝統的な新聞コラムを書く思慮深いコラムニストです。

以下の記事をもとに、簡潔なコラム（300〜400文字程度）を書いてください：
1. 今日の記事のテーマを織り交ぜる
2. 関連する歴史的逸話や哲学的な引用を含める
3. テクノロジー/ニュースを、より広い人間のテーマに結びつける
4. 思慮深く、内省的なトーンを保つ
5. 印象的な洞察や観察で締めくくる

テーマ: ${theme}

記事:
${articleSummaries}

日本語でコラムを書いてください。歴史や哲学に言及する魅力的な書き出しで始め、今日のニュースと結びつけ、考えさせられる結論で終わってください。

形式:
タイトル: [詩的または示唆に富むタイトル]
コラム: [300〜400文字程度のコラム内容]`;
  }

  // English prompt
  return `You are a thoughtful editorial columnist writing in the style of traditional newspaper editorials.

Your task is to write a brief editorial column (150-200 words) that:
1. Weaves together the themes from today's articles
2. Includes a relevant historical anecdote or philosophical reference
3. Connects the technology/news to broader human themes
4. Maintains a thoughtful, reflective tone
5. Ends with a memorable insight or observation

Theme: ${theme}

Articles:
${articleSummaries}

Write the editorial column in English. Start with a compelling opening that references history or philosophy, then connect it to today's news, and end with a thought-provoking conclusion.

Format:
Title: [A poetic or thought-provoking title]
Column: [150-200 words of editorial content]`;
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
          max_tokens: 500, // Enough for 150-200 words
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      // Execute with timeout (3 seconds)
      const response = await Promise.race([
        bedrockClient.send(command),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Bedrock API timeout')), 3000)
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
