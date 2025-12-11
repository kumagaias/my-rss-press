import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateLayout, validateLayout } from './layoutCalculator';
import { Article } from '@/types';

// Arbitrary for generating random articles
const articleArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 500 }),
  link: fc.webUrl(),
  pubDate: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts)),
  importance: fc.integer({ min: 0, max: 100 }),
});

// Helper function to create mock articles
function createMockArticle(importance: number, title: string, imageUrl?: string): Article {
  return {
    title,
    description: `Description for ${title}`,
    link: `https://example.com/${title.toLowerCase().replace(/\s+/g, '-')}`,
    pubDate: new Date(),
    importance,
    imageUrl,
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

  it('should prioritize articles with images for lead position only', () => {
    const articles = [
      createMockArticle(90, 'High importance, no image'),
      createMockArticle(85, 'Medium importance, with image', 'https://example.com/image.jpg'),
      createMockArticle(80, 'Lower importance, no image'),
    ];

    const layout = calculateLayout(articles);

    // Lead should be the article with image (85) instead of highest importance (90)
    expect(layout.lead.title).toBe('Medium importance, with image');
    expect(layout.lead.imageUrl).toBe('https://example.com/image.jpg');
    // Top stories should follow normal importance order
    expect(layout.topStories[0].title).toBe('High importance, no image');
    expect(layout.topStories[0].importance).toBe(90);
  });

  it('should use highest importance for lead when no images available', () => {
    const articles = [
      createMockArticle(90, 'High importance, no image'),
      createMockArticle(85, 'Medium importance, no image'),
      createMockArticle(80, 'Lower importance, no image'),
    ];

    const layout = calculateLayout(articles);

    // Lead should be highest importance when no images
    expect(layout.lead.title).toBe('High importance, no image');
    expect(layout.lead.importance).toBe(90);
  });

  it('should prioritize highest importance among articles with images for lead', () => {
    const articles = [
      createMockArticle(90, 'Highest, no image'),
      createMockArticle(85, 'High with image', 'https://example.com/image1.jpg'),
      createMockArticle(80, 'Medium with image', 'https://example.com/image2.jpg'),
      createMockArticle(75, 'Lower, no image'),
    ];

    const layout = calculateLayout(articles);

    // Lead should be the highest importance article with image (85)
    expect(layout.lead.title).toBe('High with image');
    expect(layout.lead.importance).toBe(85);
    expect(layout.lead.imageUrl).toBe('https://example.com/image1.jpg');
    // Top stories should include the highest importance article without image
    expect(layout.topStories[0].title).toBe('Highest, no image');
    expect(layout.topStories[0].importance).toBe(90);
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

describe('calculateLayout - Property-Based Tests', () => {
  it('Property: All articles must be included in layout (Completeness)', () => {
    fc.assert(
      fc.property(
        fc.array(articleArbitrary, { minLength: 1, maxLength: 100 }),
        (articles) => {
          const layout = calculateLayout(articles);
          const totalInLayout = 1 + layout.topStories.length + layout.remaining.length;
          return totalInLayout === articles.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Articles must be sorted by importance (Ordering)', () => {
    fc.assert(
      fc.property(
        fc.array(articleArbitrary, { minLength: 1, maxLength: 100 }),
        (articles) => {
          const layout = calculateLayout(articles);
          const allArticles = [layout.lead, ...layout.topStories, ...layout.remaining];
          
          // Check if sorted in descending order by importance
          for (let i = 0; i < allArticles.length - 1; i++) {
            if (allArticles[i].importance < allArticles[i + 1].importance) {
              return false;
            }
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Lead article must have highest importance OR be highest importance with image (Image Priority)', () => {
    fc.assert(
      fc.property(
        fc.array(articleArbitrary, { minLength: 1, maxLength: 100 }),
        (articles) => {
          const layout = calculateLayout(articles);
          const articlesWithImages = articles.filter(a => a.imageUrl);
          
          if (articlesWithImages.length > 0) {
            // If images exist, lead should be highest importance article with image
            const maxImportanceWithImage = Math.max(...articlesWithImages.map(a => a.importance));
            return layout.lead.importance === maxImportanceWithImage && layout.lead.imageUrl;
          } else {
            // If no images, lead should be highest importance overall
            const maxImportance = Math.max(...articles.map(a => a.importance));
            return layout.lead.importance === maxImportance;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Original array must not be mutated (Immutability)', () => {
    fc.assert(
      fc.property(
        fc.array(articleArbitrary, { minLength: 1, maxLength: 100 }),
        (articles) => {
          const originalOrder = articles.map(a => a.title);
          calculateLayout(articles);
          const afterOrder = articles.map(a => a.title);
          return JSON.stringify(originalOrder) === JSON.stringify(afterOrder);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Layout structure depends on article count (Structure)', () => {
    fc.assert(
      fc.property(
        fc.array(articleArbitrary, { minLength: 1, maxLength: 100 }),
        (articles) => {
          const layout = calculateLayout(articles);
          const count = articles.length;
          
          if (count <= 4) {
            return layout.topStories.length === count - 1 && layout.remaining.length === 0;
          } else if (count <= 8) {
            return layout.topStories.length === 3 && layout.remaining.length === count - 4;
          } else {
            return layout.topStories.length === 4 && layout.remaining.length === count - 5;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: validateLayout returns true for valid layouts (Validation)', () => {
    fc.assert(
      fc.property(
        fc.array(articleArbitrary, { minLength: 1, maxLength: 100 }),
        (articles) => {
          const layout = calculateLayout(articles);
          return validateLayout(articles, layout) === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property: Layout with 1 article has no topStories or remaining (Edge Case)', () => {
    fc.assert(
      fc.property(
        articleArbitrary,
        (article) => {
          const layout = calculateLayout([article]);
          return (
            layout.lead.title === article.title &&
            layout.topStories.length === 0 &&
            layout.remaining.length === 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
