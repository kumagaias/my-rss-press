import { describe, it, expect } from 'vitest';
import { calculateLayout, validateLayout } from './layoutCalculator';
import { Article } from '@/types';

// Helper function to create mock articles
function createMockArticle(importance: number, title: string): Article {
  return {
    title,
    description: `Description for ${title}`,
    link: `https://example.com/${title.toLowerCase().replace(/\s+/g, '-')}`,
    pubDate: new Date(),
    importance,
  };
}

describe('calculateLayout', () => {
  it('should throw error for empty article list', () => {
    expect(() => calculateLayout([])).toThrow('Cannot calculate layout for empty article list');
  });

  it('should handle 1-4 articles: all displayed prominently', () => {
    const articles = [
      createMockArticle(90, 'Article 1'),
      createMockArticle(80, 'Article 2'),
      createMockArticle(70, 'Article 3'),
    ];

    const layout = calculateLayout(articles);

    expect(layout.lead.importance).toBe(90);
    expect(layout.topStories).toHaveLength(2);
    expect(layout.remaining).toHaveLength(0);
    expect(validateLayout(articles, layout)).toBe(true);
  });

  it('should handle 5-8 articles: lead + 3 top stories + remaining', () => {
    const articles = [
      createMockArticle(90, 'Article 1'),
      createMockArticle(85, 'Article 2'),
      createMockArticle(80, 'Article 3'),
      createMockArticle(75, 'Article 4'),
      createMockArticle(70, 'Article 5'),
      createMockArticle(65, 'Article 6'),
    ];

    const layout = calculateLayout(articles);

    expect(layout.lead.importance).toBe(90);
    expect(layout.topStories).toHaveLength(3);
    expect(layout.topStories[0].importance).toBe(85);
    expect(layout.remaining).toHaveLength(2);
    expect(validateLayout(articles, layout)).toBe(true);
  });

  it('should handle 9+ articles: lead + 4 top stories + remaining', () => {
    const articles = [
      createMockArticle(95, 'Article 1'),
      createMockArticle(90, 'Article 2'),
      createMockArticle(85, 'Article 3'),
      createMockArticle(80, 'Article 4'),
      createMockArticle(75, 'Article 5'),
      createMockArticle(70, 'Article 6'),
      createMockArticle(65, 'Article 7'),
      createMockArticle(60, 'Article 8'),
      createMockArticle(55, 'Article 9'),
      createMockArticle(50, 'Article 10'),
    ];

    const layout = calculateLayout(articles);

    expect(layout.lead.importance).toBe(95);
    expect(layout.topStories).toHaveLength(4);
    expect(layout.topStories[0].importance).toBe(90);
    expect(layout.remaining).toHaveLength(5);
    expect(validateLayout(articles, layout)).toBe(true);
  });

  it('should sort articles by importance (descending)', () => {
    const articles = [
      createMockArticle(60, 'Low'),
      createMockArticle(90, 'High'),
      createMockArticle(75, 'Medium'),
    ];

    const layout = calculateLayout(articles);

    expect(layout.lead.title).toBe('High');
    expect(layout.topStories[0].title).toBe('Medium');
    expect(layout.topStories[1].title).toBe('Low');
  });

  it('should include all articles in the layout', () => {
    const articles = Array.from({ length: 12 }, (_, i) =>
      createMockArticle(100 - i * 5, `Article ${i + 1}`)
    );

    const layout = calculateLayout(articles);
    const allLayoutArticles = [layout.lead, ...layout.topStories, ...layout.remaining];

    expect(allLayoutArticles).toHaveLength(articles.length);
    expect(validateLayout(articles, layout)).toBe(true);
  });

  it('should handle articles with same importance', () => {
    const articles = [
      createMockArticle(80, 'Article 1'),
      createMockArticle(80, 'Article 2'),
      createMockArticle(80, 'Article 3'),
      createMockArticle(80, 'Article 4'),
      createMockArticle(80, 'Article 5'),
    ];

    const layout = calculateLayout(articles);

    expect(layout.lead.importance).toBe(80);
    expect(layout.topStories).toHaveLength(3);
    expect(layout.remaining).toHaveLength(1);
    expect(validateLayout(articles, layout)).toBe(true);
  });
});

describe('validateLayout', () => {
  it('should return true when all articles are included', () => {
    const articles = [
      createMockArticle(90, 'Article 1'),
      createMockArticle(80, 'Article 2'),
      createMockArticle(70, 'Article 3'),
    ];

    const layout = calculateLayout(articles);
    expect(validateLayout(articles, layout)).toBe(true);
  });

  it('should return false when article count mismatch', () => {
    const articles = [
      createMockArticle(90, 'Article 1'),
      createMockArticle(80, 'Article 2'),
    ];

    const layout = {
      lead: articles[0],
      topStories: [],
      remaining: [],
    };

    expect(validateLayout(articles, layout)).toBe(false);
  });
});
