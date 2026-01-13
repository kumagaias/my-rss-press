/**
 * Unit tests for Default Feed Service
 */

import { describe, it, expect } from 'vitest';
import {
  getDefaultFeeds,
  isDefaultFeed,
  type DefaultFeed,
} from '../../../src/services/defaultFeedService.js';

describe('defaultFeedService', () => {
  describe('getDefaultFeeds', () => {
    it('should return English default feeds for "en" locale', () => {
      const feeds = getDefaultFeeds('en');
      
      expect(feeds).toHaveLength(4);
      expect(feeds.every(f => f.language === 'EN')).toBe(true);
      expect(feeds.some(f => f.title === 'BBC News')).toBe(true);
      expect(feeds.some(f => f.title === 'The Guardian')).toBe(true);
    });

    it('should return Japanese default feeds for "ja" locale', () => {
      const feeds = getDefaultFeeds('ja');
      
      expect(feeds).toHaveLength(4);
      expect(feeds.every(f => f.language === 'JP')).toBe(true);
      expect(feeds.some(f => f.title === 'NHK News')).toBe(true);
      expect(feeds.some(f => f.title === 'ITmedia')).toBe(true);
    });

    it('should return different feeds for different locales', () => {
      const enFeeds = getDefaultFeeds('en');
      const jaFeeds = getDefaultFeeds('ja');
      
      expect(enFeeds).not.toEqual(jaFeeds);
    });
  });

  describe('isDefaultFeed', () => {
    it('should return true for English default feed URLs', () => {
      expect(isDefaultFeed('https://www.bbc.com/news/world/rss.xml')).toBe(true);
      expect(isDefaultFeed('https://www.theguardian.com/world/rss')).toBe(true);
    });

    it('should return true for Japanese default feed URLs', () => {
      expect(isDefaultFeed('https://www.nhk.or.jp/rss/news/cat0.xml')).toBe(true);
      expect(isDefaultFeed('https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml')).toBe(true);
    });

    it('should return false for non-default feed URLs', () => {
      expect(isDefaultFeed('https://example.com/feed')).toBe(false);
      expect(isDefaultFeed('https://techcrunch.com/feed/')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isDefaultFeed('')).toBe(false);
    });
  });

  // Note: fetchDefaultFeedArticles is tested via integration tests
  // Unit tests would require complex RSS parser mocking
});
