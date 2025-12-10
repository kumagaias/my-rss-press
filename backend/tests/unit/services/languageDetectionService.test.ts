import { describe, it, expect } from 'vitest';
import { detectLanguage, detectLanguages } from '../../../src/services/languageDetectionService.js';
import type { Article } from '../../../src/services/rssFetcherService.js';

describe('languageDetectionService', () => {
  describe('detectLanguage', () => {
    it('should detect Japanese text', () => {
      const japaneseText = 'これは日本語のテキストです';
      expect(detectLanguage(japaneseText)).toBe('JP');
    });

    it('should detect English text', () => {
      const englishText = 'This is English text';
      expect(detectLanguage(englishText)).toBe('EN');
    });

    it('should detect mixed text with majority Japanese', () => {
      const mixedText = 'これは日本語とEnglishの混合テキストです';
      expect(detectLanguage(mixedText)).toBe('JP');
    });

    it('should detect mixed text with majority English', () => {
      const mixedText = 'This is a mixed text with some 日本語';
      expect(detectLanguage(mixedText)).toBe('EN');
    });

    it('should handle empty text', () => {
      expect(detectLanguage('')).toBe('EN');
    });

    it('should handle text with only Hiragana', () => {
      const hiraganaText = 'ひらがなのみ';
      expect(detectLanguage(hiraganaText)).toBe('JP');
    });

    it('should handle text with only Katakana', () => {
      const katakanaText = 'カタカナノミ';
      expect(detectLanguage(katakanaText)).toBe('JP');
    });

    it('should handle text with only Kanji', () => {
      const kanjiText = '漢字文章';
      expect(detectLanguage(kanjiText)).toBe('JP');
    });

    it('should handle text with numbers and symbols', () => {
      const text = '123 !@# $%^';
      expect(detectLanguage(text)).toBe('EN');
    });
  });

  describe('detectLanguages', () => {
    it('should detect languages from RSS feed language field', async () => {
      const articles: Article[] = [
        {
          title: 'Article 1',
          description: 'Description 1',
          link: 'https://example.com/1',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed1',
        },
        {
          title: 'Article 2',
          description: 'Description 2',
          link: 'https://example.com/2',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed2',
        },
      ];

      const feedLanguages = new Map([
        ['https://example.com/feed1', 'ja-JP'],
        ['https://example.com/feed2', 'en-US'],
      ]);

      const languages = await detectLanguages(articles, feedLanguages);
      expect(languages.sort()).toEqual(['EN', 'JP']);
    });

    it('should detect languages from article content when RSS language is not available', async () => {
      const articles: Article[] = [
        {
          title: 'これは日本語の記事です',
          description: '日本語の説明文です',
          link: 'https://example.com/1',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed1',
        },
        {
          title: 'This is an English article',
          description: 'English description',
          link: 'https://example.com/2',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed2',
        },
      ];

      const feedLanguages = new Map();

      const languages = await detectLanguages(articles, feedLanguages);
      expect(languages.sort()).toEqual(['EN', 'JP']);
    });

    it('should return unique languages', async () => {
      const articles: Article[] = [
        {
          title: 'Article 1',
          description: 'Description 1',
          link: 'https://example.com/1',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed1',
        },
        {
          title: 'Article 2',
          description: 'Description 2',
          link: 'https://example.com/2',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed1',
        },
      ];

      const feedLanguages = new Map([['https://example.com/feed1', 'en-US']]);

      const languages = await detectLanguages(articles, feedLanguages);
      expect(languages).toEqual(['EN']);
    });

    it('should handle empty articles array', async () => {
      const articles: Article[] = [];
      const feedLanguages = new Map();

      const languages = await detectLanguages(articles, feedLanguages);
      expect(languages).toEqual([]);
    });

    it('should prioritize RSS language over content detection', async () => {
      const articles: Article[] = [
        {
          title: 'これは日本語のタイトル', // Japanese content
          description: '日本語の説明',
          link: 'https://example.com/1',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed1',
        },
      ];

      // RSS says English, but content is Japanese
      const feedLanguages = new Map([['https://example.com/feed1', 'en-US']]);

      const languages = await detectLanguages(articles, feedLanguages);
      expect(languages).toEqual(['EN']); // Should use RSS language
    });

    it('should handle articles with missing description', async () => {
      const articles: Article[] = [
        {
          title: 'これは日本語のタイトル',
          description: '',
          link: 'https://example.com/1',
          pubDate: new Date(),
          feedSource: 'https://example.com/feed1',
        },
      ];

      const feedLanguages = new Map();

      const languages = await detectLanguages(articles, feedLanguages);
      expect(languages).toEqual(['JP']);
    });
  });
});
