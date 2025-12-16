import { describe, it, expect } from 'vitest';
import {
  RELIABLE_FEEDS_BY_CATEGORY,
  getCategoryFromTheme,
  getReliableFeedsByCategory,
  getCategoriesForLocale,
  type ReliableFeed,
} from '../../../src/constants/reliableFeeds.js';

describe('reliableFeeds', () => {
  describe('RELIABLE_FEEDS_BY_CATEGORY', () => {
    it('should have at least 3 feeds per category', () => {
      for (const [category, feeds] of Object.entries(RELIABLE_FEEDS_BY_CATEGORY)) {
        expect(feeds.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('should have valid feed structure', () => {
      for (const [category, feeds] of Object.entries(RELIABLE_FEEDS_BY_CATEGORY)) {
        for (const feed of feeds) {
          expect(feed).toHaveProperty('url');
          expect(feed).toHaveProperty('title');
          expect(feed).toHaveProperty('description');
          expect(feed).toHaveProperty('language');
          expect(feed.url).toMatch(/^https?:\/\//);
          expect(['en', 'ja']).toContain(feed.language);
        }
      }
    });

    it('should have Japanese categories with -jp suffix', () => {
      const japaneseCategories = Object.keys(RELIABLE_FEEDS_BY_CATEGORY).filter(
        cat => cat.endsWith('-jp') || cat === 'general-jp'
      );
      expect(japaneseCategories.length).toBeGreaterThan(0);
    });

    it('should have English categories without -jp suffix', () => {
      const englishCategories = Object.keys(RELIABLE_FEEDS_BY_CATEGORY).filter(
        cat => !cat.endsWith('-jp')
      );
      expect(englishCategories.length).toBeGreaterThan(0);
    });
  });

  describe('getCategoryFromTheme', () => {
    it('should return correct category for English technology theme', () => {
      expect(getCategoryFromTheme('technology', 'en')).toBe('technology');
      expect(getCategoryFromTheme('tech news', 'en')).toBe('technology');
      expect(getCategoryFromTheme('AI and software', 'en')).toBe('technology');
    });

    it('should return correct category for Japanese technology theme', () => {
      expect(getCategoryFromTheme('テクノロジー', 'ja')).toBe('technology-jp');
      expect(getCategoryFromTheme('AI技術', 'ja')).toBe('technology-jp');
      expect(getCategoryFromTheme('プログラミング', 'ja')).toBe('technology-jp');
    });

    it('should return correct category for English business theme', () => {
      expect(getCategoryFromTheme('business', 'en')).toBe('business');
      expect(getCategoryFromTheme('finance news', 'en')).toBe('business');
      expect(getCategoryFromTheme('stock market', 'en')).toBe('business');
    });

    it('should return correct category for Japanese business theme', () => {
      expect(getCategoryFromTheme('ビジネス', 'ja')).toBe('business-jp');
      expect(getCategoryFromTheme('経済ニュース', 'ja')).toBe('business-jp');
      expect(getCategoryFromTheme('株式市場', 'ja')).toBe('business-jp');
    });

    it('should return correct category for English sports theme', () => {
      expect(getCategoryFromTheme('sports', 'en')).toBe('sports');
      expect(getCategoryFromTheme('football news', 'en')).toBe('sports');
      expect(getCategoryFromTheme('basketball', 'en')).toBe('sports');
    });

    it('should return correct category for Japanese sports theme', () => {
      expect(getCategoryFromTheme('スポーツ', 'ja')).toBe('sports-jp');
      expect(getCategoryFromTheme('サッカー', 'ja')).toBe('sports-jp');
      expect(getCategoryFromTheme('野球ニュース', 'ja')).toBe('sports-jp');
    });

    it('should return correct category for English entertainment theme', () => {
      expect(getCategoryFromTheme('entertainment', 'en')).toBe('entertainment');
      expect(getCategoryFromTheme('movie news', 'en')).toBe('entertainment');
      expect(getCategoryFromTheme('hollywood', 'en')).toBe('entertainment');
    });

    it('should return correct category for Japanese entertainment theme', () => {
      expect(getCategoryFromTheme('映画', 'ja')).toBe('entertainment-jp');
      expect(getCategoryFromTheme('音楽ニュース', 'ja')).toBe('entertainment-jp');
      expect(getCategoryFromTheme('エンタメ', 'ja')).toBe('entertainment-jp');
    });

    it('should return null for unknown theme', () => {
      expect(getCategoryFromTheme('unknown theme', 'en')).toBeNull();
      expect(getCategoryFromTheme('不明なテーマ', 'ja')).toBeNull();
    });

    it('should be case-insensitive', () => {
      expect(getCategoryFromTheme('TECHNOLOGY', 'en')).toBe('technology');
      expect(getCategoryFromTheme('Technology', 'en')).toBe('technology');
      expect(getCategoryFromTheme('TeCh NeWs', 'en')).toBe('technology');
    });

    it('should not return Japanese categories for English locale', () => {
      expect(getCategoryFromTheme('テクノロジー', 'en')).toBeNull();
      expect(getCategoryFromTheme('ビジネス', 'en')).toBeNull();
    });

    it('should not return English categories for Japanese locale', () => {
      expect(getCategoryFromTheme('technology', 'ja')).toBeNull();
      expect(getCategoryFromTheme('business', 'ja')).toBeNull();
    });
  });

  describe('getReliableFeedsByCategory', () => {
    it('should return feeds for valid category', () => {
      const feeds = getReliableFeedsByCategory('technology');
      expect(feeds.length).toBeGreaterThan(0);
      expect(feeds[0]).toHaveProperty('url');
      expect(feeds[0]).toHaveProperty('title');
    });

    it('should return empty array for invalid category', () => {
      const feeds = getReliableFeedsByCategory('invalid-category');
      expect(feeds).toEqual([]);
    });

    it('should return Japanese feeds for Japanese category', () => {
      const feeds = getReliableFeedsByCategory('technology-jp');
      expect(feeds.length).toBeGreaterThan(0);
      expect(feeds.every(f => f.language === 'ja')).toBe(true);
    });

    it('should return English feeds for English category', () => {
      const feeds = getReliableFeedsByCategory('technology');
      expect(feeds.length).toBeGreaterThan(0);
      expect(feeds.every(f => f.language === 'en')).toBe(true);
    });
  });

  describe('getCategoriesForLocale', () => {
    it('should return only English categories for en locale', () => {
      const categories = getCategoriesForLocale('en');
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every(cat => !cat.endsWith('-jp'))).toBe(true);
    });

    it('should return only Japanese categories for ja locale', () => {
      const categories = getCategoriesForLocale('ja');
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every(cat => cat.endsWith('-jp') || cat === 'general-jp')).toBe(true);
    });

    it('should return at least 3 categories per locale', () => {
      expect(getCategoriesForLocale('en').length).toBeGreaterThanOrEqual(3);
      expect(getCategoriesForLocale('ja').length).toBeGreaterThanOrEqual(3);
    });
  });
});
