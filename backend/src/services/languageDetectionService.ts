/**
 * Language Detection Service
 * Detects language (JP or EN) from RSS feeds and article content
 */

import type { Article } from './rssFetcherService.js';

/**
 * Detect language from text content using character-based detection
 * @param text - Text to analyze
 * @returns 'JP' for Japanese, 'EN' for English
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
 * Detect languages from articles using RSS feed language field and content analysis
 * @param articles - Array of articles to analyze
 * @param feedLanguages - Map of feed URL to language code from RSS <language> field
 * @returns Array of unique language codes (e.g., ["JP", "EN"])
 * 
 * Note: Currently only handles Japanese ('ja') and English ('en') explicitly.
 * Other languages default to 'EN' as the system primarily targets EN/JP users.
 */
export async function detectLanguages(
  articles: Article[],
  feedLanguages: Map<string, string>
): Promise<string[]> {
  const languages = new Set<string>();

  for (const article of articles) {
    // Priority 1: Check RSS feed's <language> field
    const feedLanguage = feedLanguages.get(article.feedSource);
    if (feedLanguage) {
      // Convert language code to our format (JP or EN)
      // Note: Other languages (es, fr, zh, ko, etc.) default to 'EN'
      // This is acceptable as the system primarily targets EN/JP users
      const lang = feedLanguage.toLowerCase().startsWith('ja') ? 'JP' : 'EN';
      languages.add(lang);
      continue;
    }

    // Priority 2: Detect from article content (title + first 50 chars of description)
    const description = article.description || '';
    const text = `${article.title} ${description.substring(0, 50)}`;
    const language = detectLanguage(text);
    languages.add(language);
  }

  return Array.from(languages).sort(); // Sort for consistency
}
