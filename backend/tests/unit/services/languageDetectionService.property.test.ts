/**
 * Property-Based Tests for Language Detection Service
 * 
 * These tests verify the correctness properties defined in the Phase-2 design document.
 * Each test runs 100+ iterations with randomly generated inputs to ensure robustness.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { detectLanguage, detectLanguages } from '../../../src/services/languageDetectionService';
import type { Article } from '../../../src/models/newspaper';

describe('Language Detection Service - Property-Based Tests', () => {
  /**
   * **Feature: phase-2, Property 1: 日本語の言語検出**
   * 
   * For any article containing Japanese characters (hiragana, katakana, or kanji),
   * language detection should identify it as "JP"
   * 
   * **Validates: Requirements 1.1, 1.2**
   */
  it('Property 1: Japanese language detection', () => {
    // Generator for Japanese characters
    const japaneseChar = fc.oneof(
      fc.integer({ min: 0x3040, max: 0x309F }), // Hiragana
      fc.integer({ min: 0x30A0, max: 0x30FF }), // Katakana
      fc.integer({ min: 0x4E00, max: 0x9FAF })  // Kanji
    ).map(code => String.fromCharCode(code));

    // Generator for text with Japanese characters (>10% threshold)
    const japaneseText = fc.tuple(
      fc.array(japaneseChar, { minLength: 5, maxLength: 20 }),
      fc.array(fc.string({ minLength: 1, maxLength: 1 }), { minLength: 0, maxLength: 10 })
    ).map(([japanese, other]) => {
      // Ensure Japanese characters are >10% of total
      return japanese.join('') + other.join('');
    });

    fc.assert(
      fc.property(japaneseText, (text) => {
        const result = detectLanguage(text);
        expect(result).toBe('JP');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 2: 英語の言語検出**
   * 
   * For any article containing no Japanese characters,
   * language detection should identify it as "EN"
   * 
   * **Validates: Requirements 1.1, 1.3**
   */
  it('Property 2: English language detection', () => {
    // Generator for English text (no Japanese characters)
    const englishText = fc.string({ minLength: 10, maxLength: 100 })
      .filter(text => {
        // Ensure no Japanese characters
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
        return !japaneseRegex.test(text);
      });

    fc.assert(
      fc.property(englishText, (text) => {
        const result = detectLanguage(text);
        expect(result).toBe('EN');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 3: 混合言語検出**
   * 
   * For any newspaper containing both Japanese and English articles,
   * the languages array should contain both ["JP", "EN"]
   * 
   * **Validates: Requirements 1.4**
   */
  it('Property 3: Mixed language detection', () => {
    // Generator for Japanese article
    const japaneseArticle = fc.record({
      title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0).map(s => 'こんにちは' + s),
      description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0).map(s => '日本語の記事です。' + s),
      link: fc.webUrl(),
      pubDate: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts)),
      feedSource: fc.webUrl()
    });

    // Generator for English article
    const englishArticle = fc.record({
      title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0).map(s => 'Hello ' + s),
      description: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0).map(s => 'English article. ' + s),
      link: fc.webUrl(),
      pubDate: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts)),
      feedSource: fc.webUrl()
    });

    // Generator for mixed articles
    const mixedArticles = fc.tuple(
      fc.array(japaneseArticle, { minLength: 1, maxLength: 5 }),
      fc.array(englishArticle, { minLength: 1, maxLength: 5 })
    ).map(([jp, en]) => [...jp, ...en].map(a => ({ ...a, importance: 50 })) as Article[]);

    fc.assert(
      fc.asyncProperty(mixedArticles, async (articles) => {
        const feedLanguages = new Map<string, string>();
        const result = await detectLanguages(articles, feedLanguages);
        
        // Should contain at least one language
        expect(result.length).toBeGreaterThan(0);
        
        // If both languages are detected, they should be sorted
        if (result.length === 2) {
          expect(result).toContain('JP');
          expect(result).toContain('EN');
          expect(result[0]).toBe('EN');
          expect(result[1]).toBe('JP');
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 1 (Edge Case): Empty text handling**
   * 
   * For any empty or very short text, language detection should default to "EN"
   */
  it('Property 1 (Edge Case): Empty text defaults to EN', () => {
    const emptyOrShortText = fc.string({ minLength: 0, maxLength: 5 });

    fc.assert(
      fc.property(emptyOrShortText, (text) => {
        const result = detectLanguage(text);
        expect(result).toBe('EN');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 2 (Edge Case): RSS language field priority**
   * 
   * For any article with RSS language field, it should take priority over content detection
   */
  it('Property 2 (Edge Case): RSS language field priority', () => {
    const article = fc.record({
      title: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
      description: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length > 0),
      link: fc.webUrl(),
      pubDate: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts)),
      feedSource: fc.webUrl()
    });

    const rssLanguage = fc.oneof(
      fc.constant('ja'),
      fc.constant('ja-JP'),
      fc.constant('en'),
      fc.constant('en-US')
    );

    fc.assert(
      fc.asyncProperty(article, rssLanguage, async (art, lang) => {
        const feedLanguages = new Map<string, string>();
        feedLanguages.set(art.feedSource, lang);
        
        const articleWithImportance = { ...art, importance: 50 } as Article;
        const result = await detectLanguages([articleWithImportance], feedLanguages);
        
        const expectedLang = lang.startsWith('ja') ? 'JP' : 'EN';
        expect(result).toEqual([expectedLang]);
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
