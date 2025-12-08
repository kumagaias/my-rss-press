import { describe, it, expect } from 'vitest';
import type { Locale, Article, NewspaperData, ImageAttribution } from '../../../src/models/newspaper.js';

describe('Newspaper Models - Phase 2', () => {
  describe('Locale Type', () => {
    it('should accept valid locale values', () => {
      const locales: Locale[] = ['ja', 'en-US', 'en-GB'];
      
      locales.forEach(locale => {
        expect(['ja', 'en-US', 'en-GB']).toContain(locale);
      });
    });
  });

  describe('ImageAttribution Interface', () => {
    it('should have required fields', () => {
      const attribution: ImageAttribution = {
        photographer: 'John Doe',
        photographerUrl: 'https://unsplash.com/@johndoe',
        photoUrl: 'https://unsplash.com/photos/abc123',
      };
      
      expect(attribution.photographer).toBe('John Doe');
      expect(attribution.photographerUrl).toBe('https://unsplash.com/@johndoe');
      expect(attribution.photoUrl).toBe('https://unsplash.com/photos/abc123');
    });
  });

  describe('Article Interface', () => {
    it('should support Phase 2 fields', () => {
      const article: Article = {
        title: 'Test Article',
        description: 'Test description',
        link: 'https://example.com/article',
        pubDate: '2025-12-08T00:00:00Z',
        importance: 0.8,
        imageUrl: 'https://example.com/image.jpg',
        feedSource: 'https://example.com/feed',
        imageAttribution: {
          photographer: 'Jane Smith',
          photographerUrl: 'https://unsplash.com/@janesmith',
          photoUrl: 'https://unsplash.com/photos/xyz789',
        },
      };
      
      expect(article.imageAttribution).toBeDefined();
      expect(article.imageAttribution?.photographer).toBe('Jane Smith');
      expect(article.feedSource).toBe('https://example.com/feed');
    });

    it('should work without optional Phase 2 fields', () => {
      const article: Article = {
        title: 'Test Article',
        description: 'Test description',
        link: 'https://example.com/article',
        pubDate: '2025-12-08T00:00:00Z',
        importance: 0.8,
      };
      
      expect(article.imageAttribution).toBeUndefined();
      expect(article.feedSource).toBeUndefined();
    });
  });

  describe('NewspaperData Interface', () => {
    it('should support Phase 2 fields', () => {
      const newspaper: NewspaperData = {
        newspaperId: 'abc123_2025-12-08',
        name: 'Test Newspaper',
        userName: 'Test User',
        feedUrls: ['https://example.com/feed'],
        createdAt: '2025-12-08T00:00:00Z',
        updatedAt: '2025-12-08T00:00:00Z',
        viewCount: 0,
        isPublic: true,
        locale: 'ja',
        seriesId: 'abc123',
        publishDate: '2025-12-08',
        summary: 'Line 1\nLine 2\nLine 3',
      };
      
      expect(newspaper.seriesId).toBe('abc123');
      expect(newspaper.publishDate).toBe('2025-12-08');
      expect(newspaper.summary).toBe('Line 1\nLine 2\nLine 3');
      expect(newspaper.locale).toBe('ja');
    });

    it('should work without optional Phase 2 fields for backward compatibility', () => {
      const newspaper: NewspaperData = {
        newspaperId: 'old-id',
        name: 'Old Newspaper',
        userName: 'Old User',
        feedUrls: ['https://example.com/feed'],
        createdAt: '2025-12-08T00:00:00Z',
        updatedAt: '2025-12-08T00:00:00Z',
        viewCount: 0,
        isPublic: true,
        locale: 'ja',
      };
      
      expect(newspaper.seriesId).toBeUndefined();
      expect(newspaper.publishDate).toBeUndefined();
      expect(newspaper.summary).toBeUndefined();
    });

    it('should support all three locales', () => {
      const locales: Locale[] = ['ja', 'en-US', 'en-GB'];
      
      locales.forEach(locale => {
        const newspaper: NewspaperData = {
          newspaperId: 'test-id',
          name: 'Test',
          userName: 'User',
          feedUrls: ['https://example.com/feed'],
          createdAt: '2025-12-08T00:00:00Z',
          updatedAt: '2025-12-08T00:00:00Z',
          viewCount: 0,
          isPublic: true,
          locale,
        };
        
        expect(newspaper.locale).toBe(locale);
      });
    });
  });
});
