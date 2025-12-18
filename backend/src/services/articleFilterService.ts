import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config.js';
import type { Article } from './rssFetcherService.js';

// Bedrock client configuration
const bedrockClient = new BedrockRuntimeClient({
  region: config.bedrockRegion,
});

/**
 * Filter articles by theme relevance using Bedrock AI
 * 
 * @param articles - Array of articles to filter
 * @param theme - User's theme/interest
 * @param locale - User's language preference ('en' or 'ja')
 * @param minThreshold - Minimum relevance score (0.0-1.0, default: 0.3)
 * @returns Filtered articles (or all articles if filtering fails)
 */
export async function filterArticlesByTheme(
  articles: Article[],
  theme: string,
  locale: 'en' | 'ja' = 'en',
  minThreshold: number = 0.3
): Promise<Article[]> {
  // Skip filtering if too few articles
  if (articles.length < 8) {
    console.log(`[ArticleFilter] Skipping filter: only ${articles.length} articles (< 8)`);
    return articles;
  }

  try {
    console.log(`[ArticleFilter] Filtering ${articles.length} articles by theme: "${theme}"`);
    
    // Build prompt for batch filtering
    const prompt = buildFilterPrompt(articles, theme, locale);
    
    // Call Bedrock for batch judgment
    const startTime = Date.now();
    const relevanceScores = await callBedrockForFiltering(prompt);
    const bedrockTime = Date.now() - startTime;
    
    console.log(`[ArticleFilter] Bedrock API call completed in ${bedrockTime}ms`);
    
    // Parse response and filter articles
    const filteredArticles = articles.filter((_, index) => {
      const score = relevanceScores[index];
      return score !== undefined && score >= minThreshold;
    });
    
    console.log(`[ArticleFilter] Filtered: ${filteredArticles.length}/${articles.length} articles (threshold: ${minThreshold})`);
    
    // Fallback: If filtered result has < 8 articles, return all articles
    if (filteredArticles.length < 8) {
      console.log(`[ArticleFilter] Fallback: filtered result has only ${filteredArticles.length} articles (< 8), returning all articles`);
      return articles;
    }
    
    return filteredArticles;
  } catch (error) {
    console.error('[ArticleFilter] Filtering failed:', error);
    if (error instanceof Error) {
      console.error('[ArticleFilter] Error message:', error.message);
    }
    
    // Fallback: Return all articles if filtering fails
    console.log('[ArticleFilter] Fallback: returning all articles due to error');
    return articles;
  }
}

/**
 * Build prompt for article filtering
 */
function buildFilterPrompt(articles: Article[], theme: string, locale: 'en' | 'ja'): string {
  // Create article list with index
  const articleList = articles.map((article, index) => {
    return `${index}. ${article.title}\n   ${article.description.substring(0, 100)}...`;
  }).join('\n\n');
  
  if (locale === 'ja') {
    return `以下の記事が「${theme}」というテーマにどれだけ関連しているか、0.0〜1.0のスコアで評価してください。

テーマ: ${theme}

記事リスト:
${articleList}

重要: JSONのみを返してください。説明文や前置きは不要です。

{
  "scores": [0.8, 0.3, 0.9, ...]
}

評価基準:
- 1.0: テーマに完全に一致
- 0.7-0.9: テーマに強く関連
- 0.4-0.6: テーマに部分的に関連
- 0.1-0.3: テーマにわずかに関連
- 0.0: テーマに無関係`;
  } else {
    return `Rate how relevant each article is to the theme "${theme}" with a score from 0.0 to 1.0.

Theme: ${theme}

Article List:
${articleList}

IMPORTANT: Return ONLY JSON. No explanations or preamble.

{
  "scores": [0.8, 0.3, 0.9, ...]
}

Rating Criteria:
- 1.0: Perfectly matches the theme
- 0.7-0.9: Strongly related to the theme
- 0.4-0.6: Partially related to the theme
- 0.1-0.3: Slightly related to the theme
- 0.0: Unrelated to the theme`;
  }
}

/**
 * Call Bedrock API for article filtering
 */
async function callBedrockForFiltering(prompt: string): Promise<number[]> {
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Low temperature for consistent filtering
    }),
  });

  const response = await bedrockClient.send(command);
  return parseFilterResponse(response);
}

/**
 * Parse Bedrock response to extract relevance scores
 */
function parseFilterResponse(response: any): number[] {
  try {
    // Decode response body
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[ArticleFilter] No JSON found in response');
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const scores = parsed.scores || [];
    
    console.log(`[ArticleFilter] Parsed ${scores.length} relevance scores`);
    
    return scores;
  } catch (error) {
    console.error('[ArticleFilter] Failed to parse response:', error);
    throw error;
  }
}
