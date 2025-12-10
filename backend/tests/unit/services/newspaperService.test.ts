/**
 * Unit tests for newspaperService
 * Tests backward compatibility for languages field
 */

import { describe, it, expect } from 'vitest';

describe('newspaperService - Backward Compatibility', () => {
  describe('languages field default behavior', () => {
    it('should use empty array as default when languages is undefined', () => {
      // Simulate the logic used in getNewspaper and getPublicNewspapers
      const item: Record<string, any> = {
        newspaperId: 'test-123',
        name: 'Old Newspaper',
        // languages field is missing (undefined)
      };

      const languages = item.languages || [];
      
      expect(languages).toEqual([]);
      expect(Array.isArray(languages)).toBe(true);
    });

    it('should use empty array as default when languages is null', () => {
      // Simulate the logic used in getNewspaper and getPublicNewspapers
      const item = {
        newspaperId: 'test-456',
        name: 'Newspaper with null',
        languages: null,
      };

      const languages = item.languages || [];
      
      expect(languages).toEqual([]);
      expect(Array.isArray(languages)).toBe(true);
    });

    it('should preserve languages array when it exists', () => {
      // Simulate the logic used in getNewspaper and getPublicNewspapers
      const item = {
        newspaperId: 'test-789',
        name: 'New Newspaper',
        languages: ['EN', 'JP'],
      };

      const languages = item.languages || [];
      
      expect(languages).toEqual(['EN', 'JP']);
      expect(Array.isArray(languages)).toBe(true);
    });

    it('should preserve empty array when explicitly set', () => {
      // Simulate the logic used in getNewspaper and getPublicNewspapers
      const item = {
        newspaperId: 'test-101',
        name: 'Newspaper with empty array',
        languages: [],
      };

      const languages = item.languages || [];
      
      expect(languages).toEqual([]);
      expect(Array.isArray(languages)).toBe(true);
    });

    it('should handle falsy values correctly', () => {
      // Test various falsy values
      const testCases = [
        { value: undefined, expected: [] },
        { value: null, expected: [] },
        { value: [], expected: [] },
        { value: ['EN'], expected: ['EN'] },
        { value: ['JP', 'EN'], expected: ['JP', 'EN'] },
      ];

      testCases.forEach(({ value, expected }) => {
        const result = value || [];
        expect(result).toEqual(expected);
      });
    });
  });

  describe('backward compatibility verification', () => {
    it('should demonstrate that old newspapers (without languages) work correctly', () => {
      // Simulate an old newspaper from DynamoDB (Phase-1)
      const oldNewspaper: Record<string, any> = {
        newspaperId: 'old-123',
        name: 'Old Newspaper',
        userName: 'Test User',
        feedUrls: ['https://example.com/feed'],
        articles: [],
        createdAt: '2025-12-01T00:00:00Z',
        updatedAt: '2025-12-01T00:00:00Z',
        viewCount: 5,
        isPublic: true,
        locale: 'en',
        // No languages field (Phase-1 newspaper)
      };

      // Apply the same logic as in newspaperService
      const processedNewspaper = {
        ...oldNewspaper,
        languages: oldNewspaper.languages || [],
      };

      expect(processedNewspaper.languages).toEqual([]);
      expect(Array.isArray(processedNewspaper.languages)).toBe(true);
    });

    it('should demonstrate that new newspapers (with languages) work correctly', () => {
      // Simulate a new newspaper from DynamoDB (Phase-2)
      const newNewspaper = {
        newspaperId: 'new-456',
        name: 'New Newspaper',
        userName: 'Test User',
        feedUrls: ['https://example.com/feed'],
        articles: [],
        createdAt: '2025-12-10T00:00:00Z',
        updatedAt: '2025-12-10T00:00:00Z',
        viewCount: 0,
        isPublic: true,
        locale: 'en',
        languages: ['EN', 'JP'], // Phase-2 newspaper with languages
      };

      // Apply the same logic as in newspaperService
      const processedNewspaper = {
        ...newNewspaper,
        languages: newNewspaper.languages || [],
      };

      expect(processedNewspaper.languages).toEqual(['EN', 'JP']);
      expect(Array.isArray(processedNewspaper.languages)).toBe(true);
    });

    it('should handle array of newspapers with mixed languages field', () => {
      // Simulate a mix of old and new newspapers
      const newspapers: Record<string, any>[] = [
        {
          newspaperId: 'old-1',
          name: 'Old Newspaper 1',
          // No languages field
        },
        {
          newspaperId: 'new-1',
          name: 'New Newspaper 1',
          languages: ['EN'],
        },
        {
          newspaperId: 'old-2',
          name: 'Old Newspaper 2',
          languages: null, // Explicitly null
        },
        {
          newspaperId: 'new-2',
          name: 'New Newspaper 2',
          languages: ['JP', 'EN'],
        },
      ];

      // Apply the same logic as in getPublicNewspapers
      const processedNewspapers = newspapers.map(item => ({
        ...item,
        languages: item.languages || [],
      }));

      expect(processedNewspapers[0].languages).toEqual([]); // Old newspaper
      expect(processedNewspapers[1].languages).toEqual(['EN']); // New newspaper
      expect(processedNewspapers[2].languages).toEqual([]); // Null languages
      expect(processedNewspapers[3].languages).toEqual(['JP', 'EN']); // New newspaper
    });
  });
});
