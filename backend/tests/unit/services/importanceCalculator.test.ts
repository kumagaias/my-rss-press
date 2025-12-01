import { describe, it, expect } from 'vitest';
import { calculateImportanceFallback } from '../../../src/services/importanceCalculator.js';
import type { Article } from '../../../src/services/rssFetcherService.js';

describe('Importance Calculator', () => {
  describe('calculateImportanceFallback', () => {
    it('should return a score between 0 and 100', () => {
      const article: Article = {
        title: 'Test Article',
        description: 'Test description',
        link: 'https://example.com',
        pubDate: new Date(),
        feedSource: 'https://example.com/feed',
      };

      const score = calculateImportanceFallback(article);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher scores to articles with images', () => {
      const articleWithoutImage: Article = {
        title: 'Test Article',
        description: 'Test description',
        link: 'https://example.com',
        pubDate: new Date(),
        feedSource: 'https://example.com/feed',
      };

      const articleWithImage: Article = {
        ...articleWithoutImage,
        imageUrl: 'https://example.com/image.jpg',
      };

      // Run multiple times to account for randomness
      const scoresWithoutImage: number[] = [];
      const scoresWithImage: number[] = [];

      for (let i = 0; i < 10; i++) {
        scoresWithoutImage.push(calculateImportanceFallback(articleWithoutImage));
        scoresWithImage.push(calculateImportanceFallback(articleWithImage));
      }

      const avgWithoutImage = scoresWithoutImage.reduce((a, b) => a + b, 0) / scoresWithoutImage.length;
      const avgWithImage = scoresWithImage.reduce((a, b) => a + b, 0) / scoresWithImage.length;

      // Articles with images should have higher average scores
      expect(avgWithImage).toBeGreaterThan(avgWithoutImage);
    });

    it('should give higher scores to articles with longer titles', () => {
      const shortTitleArticle: Article = {
        title: 'Short',
        description: 'Test description',
        link: 'https://example.com',
        pubDate: new Date(),
        feedSource: 'https://example.com/feed',
      };

      const longTitleArticle: Article = {
        title: 'This is a much longer title that should receive a higher importance score',
        description: 'Test description',
        link: 'https://example.com',
        pubDate: new Date(),
        feedSource: 'https://example.com/feed',
      };

      // Run multiple times to account for randomness
      const shortScores: number[] = [];
      const longScores: number[] = [];

      for (let i = 0; i < 10; i++) {
        shortScores.push(calculateImportanceFallback(shortTitleArticle));
        longScores.push(calculateImportanceFallback(longTitleArticle));
      }

      const avgShort = shortScores.reduce((a, b) => a + b, 0) / shortScores.length;
      const avgLong = longScores.reduce((a, b) => a + b, 0) / longScores.length;

      // Longer titles should have higher average scores
      expect(avgLong).toBeGreaterThan(avgShort);
    });
  });
});
