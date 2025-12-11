/**
 * Property-Based Tests for Language Filtering
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
  languages?: string[];
  createdAt: string;
  viewCount: number;
}

// Language filter function (to be implemented in actual code)
function filterByLanguage(newspapers: Newspaper[], selectedLanguage: 'JP' | 'EN' | 'ALL'): Newspaper[] {
  if (selectedLanguage === 'ALL') {
    return newspapers;
  }
  
  return newspapers.filter(newspaper => {
    // Newspapers without languages field should be shown in all filters
    if (!newspaper.languages || newspaper.languages.length === 0) {
      return true;
    }
    return newspaper.languages.includes(selectedLanguage);
  });
}

// Default language selection function
function getDefaultLanguage(locale: string): 'JP' | 'EN' {
  return locale.startsWith('ja') ? 'JP' : 'EN';
}

describe('Language Filtering - Property-Based Tests', () => {
  /**
   * **Feature: phase-2, Property 4: 言語フィルターの正確性**
   * 
   * For any language filter selection (JP or EN), all displayed newspapers
   * should include that language in their languages array
   * 
   * **Validates: Requirements 2.4, 2.5, 2.6**
   */
  it('Property 4: Language filter accuracy', () => {
    // Generator for newspapers with languages
    const newspaperWithLanguages = fc.record({
      newspaperId: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      languages: fc.array(fc.oneof(fc.constant('JP'), fc.constant('EN')), { minLength: 1, maxLength: 2 }),
      createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
      viewCount: fc.integer({ min: 0, max: 1000 })
    });

    const newspapers = fc.array(newspaperWithLanguages, { minLength: 1, maxLength: 20 });
    const selectedLanguage = fc.oneof(fc.constant('JP' as const), fc.constant('EN' as const));

    fc.assert(
      fc.property(newspapers, selectedLanguage, (news, lang) => {
        const filtered = filterByLanguage(news, lang);
        
        // All filtered newspapers should include the selected language
        filtered.forEach(newspaper => {
          if (newspaper.languages && newspaper.languages.length > 0) {
            expect(newspaper.languages).toContain(lang);
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 5: デフォルト言語選択**
   * 
   * For any Japanese UI locale user, the default language filter should be "JP",
   * and for English UI locale, it should be "EN"
   * 
   * **Validates: Requirements 2.2, 2.3**
   */
  it('Property 5: Default language selection', () => {
    const locale = fc.oneof(
      fc.constant('ja'),
      fc.constant('ja-JP'),
      fc.constant('en'),
      fc.constant('en-US'),
      fc.constant('en-GB')
    );

    fc.assert(
      fc.property(locale, (loc) => {
        const defaultLang = getDefaultLanguage(loc);
        
        if (loc.startsWith('ja')) {
          expect(defaultLang).toBe('JP');
        } else {
          expect(defaultLang).toBe('EN');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 4 (Backward Compatibility): Newspapers without languages**
   * 
   * For any newspaper without languages field (Phase-1 newspapers),
   * it should be displayed in all language filters
   */
  it('Property 4 (Backward Compatibility): Newspapers without languages', () => {
    // Generator for newspapers without languages field
    const newspaperWithoutLanguages = fc.record({
      newspaperId: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      languages: fc.constant(undefined),
      createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
      viewCount: fc.integer({ min: 0, max: 1000 })
    });

    const newspapers = fc.array(newspaperWithoutLanguages, { minLength: 1, maxLength: 10 });
    const selectedLanguage = fc.oneof(
      fc.constant('JP' as const),
      fc.constant('EN' as const),
      fc.constant('ALL' as const)
    );

    fc.assert(
      fc.property(newspapers, selectedLanguage, (news, lang) => {
        const filtered = filterByLanguage(news, lang);
        
        // All newspapers without languages should be included
        expect(filtered.length).toBe(news.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 4 (Edge Case): Empty languages array**
   * 
   * For any newspaper with empty languages array,
   * it should be displayed in all language filters
   */
  it('Property 4 (Edge Case): Empty languages array', () => {
    const newspaperWithEmptyLanguages = fc.record({
      newspaperId: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      languages: fc.constant([]),
      createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
      viewCount: fc.integer({ min: 0, max: 1000 })
    });

    const newspapers = fc.array(newspaperWithEmptyLanguages, { minLength: 1, maxLength: 10 });
    const selectedLanguage = fc.oneof(
      fc.constant('JP' as const),
      fc.constant('EN' as const)
    );

    fc.assert(
      fc.property(newspapers, selectedLanguage, (news, lang) => {
        const filtered = filterByLanguage(news, lang);
        
        // All newspapers with empty languages should be included
        expect(filtered.length).toBe(news.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: phase-2, Property 4 (Completeness): ALL filter shows all newspapers**
   * 
   * For any newspaper list, selecting "ALL" filter should show all newspapers
   */
  it('Property 4 (Completeness): ALL filter shows all newspapers', () => {
    const newspaper = fc.record({
      newspaperId: fc.uuid(),
      name: fc.string({ minLength: 5, maxLength: 50 }),
      languages: fc.option(fc.array(fc.oneof(fc.constant('JP'), fc.constant('EN')), { minLength: 0, maxLength: 2 })),
      createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2025-12-31').getTime() }).map(ts => new Date(ts).toISOString()),
      viewCount: fc.integer({ min: 0, max: 1000 })
    });

    const newspapers = fc.array(newspaper, { minLength: 0, maxLength: 50 });

    fc.assert(
      fc.property(newspapers, (news) => {
        const filtered = filterByLanguage(news, 'ALL');
        
        // ALL filter should return all newspapers
        expect(filtered.length).toBe(news.length);
        expect(filtered).toEqual(news);
      }),
      { numRuns: 100 }
    );
  });
});
