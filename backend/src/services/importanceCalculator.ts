import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';
import type { Article } from './rssFetcherService.js';

// Bedrock client configuration
const bedrockClient = new BedrockRuntimeClient({
  region: config.bedrockRegion,
});

/**
 * Calculate importance scores for articles using AWS Bedrock
 * @param articles - Array of articles
 * @param userTheme - User's theme keyword
 * @returns Articles with importance scores
 */
export async function calculateImportance(
  articles: Article[],
  userTheme: string
): Promise<Article[]> {
  // Use mock mode if enabled
  if (config.useMockBedrock) {
    console.log('Using mock importance calculation');
    return articles.map(article => ({
      ...article,
      importance: calculateImportanceFallback(article),
    }));
  }

  try {
    // Build prompt for importance calculation
    const prompt = buildImportancePrompt(articles, userTheme);

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
        temperature: 0.8, // Add randomness for variation
      }),
    });

    const response = await bedrockClient.send(command);
    const scores = parseImportanceResponse(response);

    // Assign importance scores to articles
    return articles.map((article, index) => ({
      ...article,
      importance: scores[index] || 50, // Default to 50 if score missing
    }));
  } catch (error) {
    console.error('Bedrock importance calculation error:', error);
    console.log('Falling back to simple algorithm');

    // Fallback to simple algorithm
    return articles.map(article => ({
      ...article,
      importance: calculateImportanceFallback(article),
    }));
  }
}

/**
 * Build prompt for importance calculation
 */
function buildImportancePrompt(articles: Article[], userTheme: string): string {
  // Add randomness to perspective
  const perspectives = [
    '今日の気分で',
    '新鮮な視点で',
    '異なる角度から',
    'ユニークな観点で',
    '多様な視点で',
  ];
  const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
  const timestamp = new Date().toISOString();

  // Build article list
  const articleList = articles
    .map((article, index) => {
      return `${index + 1}. タイトル: ${article.title}, 説明: ${article.description.substring(0, 200)}, 画像: ${article.imageUrl ? 'あり' : 'なし'}`;
    })
    .join('\n');

  return `ユーザーは「${userTheme}」に興味があります。
${randomPerspective}、以下の記事リストからユーザーにとっての重要度を0-100のスコアで評価してください。

評価基準：
1. ユーザーのテーマとの関連性（最重要）
2. 画像の有無（画像付きは+10点）
3. タイトルの魅力度と新鮮さ

記事リスト：
${articleList}

注意: 同じような重要度の記事がある場合、少しバリエーションを持たせてください。
生成時刻: ${timestamp}

各記事の重要度スコア（0-100）をJSON形式で返してください：
{"scores": [85, 70, 60, ...]}`;
}

/**
 * Parse importance response from Bedrock
 */
function parseImportanceResponse(response: any): number[] {
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
    const scores = parsed.scores || [];

    // Validate scores are numbers between 0-100
    return scores.map((score: any) => {
      const num = Number(score);
      if (isNaN(num)) return 50;
      return Math.max(0, Math.min(100, num));
    });
  } catch (error) {
    console.error('Failed to parse importance response:', error);
    throw error;
  }
}

// Scoring constants for fallback algorithm
const TITLE_SCORE_MULTIPLIER = 0.6; // Weight for title length
const MAX_TITLE_SCORE = 60; // Maximum points from title length
const IMAGE_BONUS = 40; // Bonus points for having an image
const RANDOM_VARIATION_RANGE = 20; // Range for random variation (±10 points)

/**
 * Fallback algorithm for importance calculation
 * Uses a simple scoring system based on title length and image presence
 * @param article - Article to calculate importance for
 * @returns Importance score (0-100)
 */
export function calculateImportanceFallback(article: Article): number {
  const titleLength = article.title.length;
  const hasImage = !!article.imageUrl;

  // Title score: longer titles get higher scores (up to MAX_TITLE_SCORE points)
  const titleScore = Math.min(titleLength * TITLE_SCORE_MULTIPLIER, MAX_TITLE_SCORE);

  // Image bonus: IMAGE_BONUS points if image present
  const imageBonus = hasImage ? IMAGE_BONUS : 0;

  // Add randomness for variation (±10 points)
  const randomVariation = (Math.random() - 0.5) * RANDOM_VARIATION_RANGE;

  const totalScore = titleScore + imageBonus + randomVariation;

  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, Math.round(totalScore)));
}
