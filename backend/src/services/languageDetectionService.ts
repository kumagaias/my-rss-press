/**
 * Language Detection Service
 * 
 * Detects the language of articles based on:
 * 1. RSS feed language field (priority)
 * 2. Character-based detection (fallback)
 */

import type { Article } from './rssFetcherService';

/**
 * Detect language from text content using character-based analysis
 * 
 * @param text - Text to analyze
 * @returns 'JP' if Japanese characters > 10%, otherwise 'EN'
 */
export function detectLanguage(text: string): 'JP' | 'EN' {
  if (!text || text.length === 0) {
    return 'EN'; // Default to English for empty text
  }

  // Count Japanese characters (Hiragana, Katakana, Kanji)
  // Unicode ranges:
  // - Hiragana: \u3040-\u309F
  // - Katakana: \u30A0-\u30FF
  // - Kanji: \u4E00-\u9FAF
  const japaneseChars = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g);
  const japaneseCount = japaneseChars ? japaneseChars.length : 0;

  // If more than 10% of characters are Japanese, classify as Japanese
  const threshold = text.length * 0.1;
  return japaneseCount > threshold ? 'JP' : 'EN';
}

/**
 * Detect languages from a collection of articles
 * 
 * Priority:
 * 1. RSS feed language field (if available)
 * 2. Character-based detection from article content
 * 
 * @param articles - Array of articles to analyze
 * @param feedLanguages - Map of feed URL to language code
 * @returns Array of unique language codes detected
 */
export async function detectLanguages(
  articles: Article[],
  feedLanguages: Map<string, string>
): Promise<string[]> {
  const languages = new Set<string>();

  for (const article of articles) {
    // Priority 1: Check RSS feed language field
    const feedLanguage = feedLanguages.get(article.feedSource);
    if (feedLanguage) {
      // Normalize language code: 'ja', 'ja-JP' -> 'JP'
      const lang = feedLanguage.toLowerCase().startsWith('ja') ? 'JP' : 'EN';
      languages.add(lang);
      continue;
    }

    // Priority 2: Detect from article content
    // Use title + first 50 characters of description
    const description = article.description || '';
    const text = `${article.title} ${description.substring(0, 50)}`;
    const language = detectLanguage(text);
    languages.add(language);
  }

  return Array.from(languages);
}
