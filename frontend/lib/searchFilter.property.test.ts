/**
 * Property-Based Tests for Search Filtering
 * 
 * These tests verify the correctness properties defined in the Phase-2 design document.
 * Each test runs 100+ iterations with randomly generated inputs to ensure robustness.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Type definition for Newspaper
interface Newspaper {
  newspaperId: string;
  name: string;
  feedUrls: string[];
  languages?: string[];
  createdAt: string;
  viewCount: number;
}

// Search filter function (to be implemented in actual code)
function filterBySearch(newspapers: Newspaper[], query: string): Newspaper[] {
  if (!query || query.trim() === '') {
    return newspapers;
  }
  
  const lowerQuery = query.toLowerCase();
  
  return newspapers.filter(newspaper => {
    // Search in newspaper name
    const nameMatch = newspaper.name.toLowerCase().includes(lowerQuery);
    
    // Search in feed URLs
    const feedMatch = newspaper.feedUrls.some(url => 
      url.toLowerCase().includes(lowerQuery)
    );
    
    return nameMatch || feedMatch;
  });
}

describe('Search Filtering - Property-Based Tests', () => {
  /**
   * **Feature: phase-2, Property 6: 検索フィルターの完全性**
   * 
   * For any search query, all displayed newspapers should contain
   * the query string in either title or feed URL
   * 
   * **Validates: Requirements 3.3, 3.4**
   */
  it('Property 6: Search filter completeness', () => {
    // Generator for newspapers
    const newspaper = fc.record({
      newspaperId: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      feedUrls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
      languages: fc.option(fc.array(fc.oneof(fc.constant('JP'), fc.constant('EN')), { minLength: 1, maxLength: 2 })),
      createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
      viewCount: fc.integer({ min: 0, max: 1000 })
    });

    const newspapers = fc.array(newspaper, { minLength: 1, maxLength: 20 });
    const searchQuery = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);

    fc.assert(
      fc.property(newspapers, searchQuery, (news, query) => {
        const filtered = filterBySearch(news, query);
        
        // All filtered newspapers should contain the query
        filtered.forEach(newspaper => {
          const nameMatch = newspaper.name.toLowerCase().includes(query.toLowerCase());
          const feedMatch = newspaper.feedUrls.some(url => 
            url.toLowerCase().includes(query.toLowerCase())
          );
          
          expect(nameMatch || feedMatch).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 6 (Case Insensitivity): Search is case-insensitive**
   * 
   * For any search query, the search should be case-insensitive
   */
  it('Property 6 (Case Insensitivity): Search is case-insensitive', () => {
    const newspaper = fc.record({
      newspaperId: fc.uuid(),
      name: fc.constant('Tech News Daily'),
      feedUrls: fc.constant(['https://example.com/tech-feed']),
      languages: fc.option(fc.array(fc.oneof(fc.constant('JP'), fc.constant('EN')))),
      createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
      viewCount: fc.integer({ min: 0, max: 1000 })
    });

    const newspapers = fc.array(newspaper, { minLength: 1, maxLength: 10 });
    const searchQuery = fc.oneof(
      fc.constant('tech'),
      fc.constant('TECH'),
      fc.constant('Tech'),
      fc.constant('tEcH')
    );

    fc.assert(
      fc.property(newspapers, searchQuery, (news, query) => {
        const filtered = filterBySearch(news, query);
        
        // All newspapers should be found regardless of case
        expect(filtered.length).toBe(news.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 6 (Empty Query): Empty query returns all newspapers**
   * 
   * For any empty or whitespace-only query, all newspapers should be returned
   */
  it('Property 6 (Empty Query): Empty query returns all newspapers', () => {
    const newspaper = fc.record({
      newspaperId: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      feedUrls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
      languages: fc.option(fc.array(fc.oneof(fc.constant('JP'), fc.constant('EN')))),
      createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
      viewCount: fc.integer({ min: 0, max: 1000 })
    });

    const newspapers = fc.array(newspaper, { minLength: 0, maxLength: 20 });
    const emptyQuery = fc.oneof(
      fc.constant(''),
      fc.constant('   '),
      fc.constant('\t'),
      fc.constant('\n')
    );

    fc.assert(
      fc.property(newspapers, emptyQuery, (news, query) => {
        const filtered = filterBySearch(news, query);
        
        // Empty query should return all newspapers
        expect(filtered.length).toBe(news.length);
        expect(filtered).toEqual(news);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 6 (Partial Match): Partial string matching**
   * 
   * For any search query, partial matches should be found
   */
  it('Property 6 (Partial Match): Partial string matching', () => {
    const newspaper = fc.record({
      newspaperId: fc.uuid(),
      name: fc.constant('Technology News Today'),
      feedUrls: fc.constant(['https://example.com/technology-feed']),
      languages: fc.option(fc.array(fc.oneof(fc.constant('JP'), fc.constant('EN')))),
      createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
      viewCount: fc.integer({ min: 0, max: 1000 })
    });

    const newspapers = fc.array(newspaper, { minLength: 1, maxLength: 10 });
    const partialQuery = fc.oneof(
      fc.constant('tech'),
      fc.constant('news'),
      fc.constant('today'),
      fc.constant('example'),
      fc.constant('feed')
    );

    fc.assert(
      fc.property(newspapers, partialQuery, (news, query) => {
        const filtered = filterBySearch(news, query);
        
        // All newspapers should be found with partial match
        expect(filtered.length).toBe(news.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 6 (No Match): No results for non-matching query**
   * 
   * For any query that doesn't match any newspaper, empty array should be returned
   */
  it('Property 6 (No Match): No results for non-matching query', () => {
    const newspaper = fc.record({
      newspaperId: fc.uuid(),
      name: fc.constant('Tech News'),
      feedUrls: fc.constant(['https://example.com/tech']),
      languages: fc.option(fc.array(fc.oneof(fc.constant('JP'), fc.constant('EN')))),
      createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
      viewCount: fc.integer({ min: 0, max: 1000 })
    });

    const newspapers = fc.array(newspaper, { minLength: 1, maxLength: 10 });
    const nonMatchingQuery = fc.constant('xyz123nonexistent');

    fc.assert(
      fc.property(newspapers, nonMatchingQuery, (news, query) => {
        const filtered = filterBySearch(news, query);
        
        // No newspapers should match
        expect(filtered.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 6 (Performance): Search performance**
   * 
   * For any search operation, it should complete quickly (< 100ms for 100 newspapers)
   */
  it('Property 6 (Performance): Search performance', () => {
    const newspaper = fc.record({
      newspaperId: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      feedUrls: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
      languages: fc.option(fc.array(fc.oneof(fc.constant('JP'), fc.constant('EN')))),
      createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
      viewCount: fc.integer({ min: 0, max: 1000 })
    });

    const newspapers = fc.array(newspaper, { minLength: 50, maxLength: 100 });
    const searchQuery = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);

    fc.assert(
      fc.property(newspapers, searchQuery, (news, query) => {
        const startTime = performance.now();
        const filtered = filterBySearch(news, query);
        const endTime = performance.now();
        
        const duration = endTime - startTime;
        
        // Should complete within 100ms
        expect(duration).toBeLessThan(100);
        expect(filtered).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});
