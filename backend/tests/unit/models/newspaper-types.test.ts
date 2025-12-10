/**
 * Type definition tests for Phase-2 Newspaper model
 * Verifies that new optional fields are correctly typed
 */

import { describe, it, expect } from 'vitest';
import type { NewspaperData, Article } from '../../../src/models/newspaper.js';

describe('Newspaper Type Definitions - Phase 2', () => {
  it('should allow NewspaperData with all Phase-2 fields', () => {
    const newspaper: NewspaperData = {
      newspaperId: 'test-123',
      name: 'Test Newspaper',
      userName: 'Test User',
      feedUrls: ['https://example.com/feed'],
      articles: [],
      createdAt: '2025-12-10T00:00:00Z',
      updatedAt: '2025-12-10T00:00:00Z',
      viewCount: 0,
      isPublic: true,
      locale: 'en',
      // Phase-2 new fields
      languages: ['EN', 'JP'],
      summary: 'This is a test summary',
      newspaperDate: '2025-12-10',
    };

    expect(newspaper.languages).toEqual(['EN', 'JP']);
    expect(newspaper.summary).toBe('This is a test summary');
    expect(newspaper.newspaperDate).toBe('2025-12-10');
  });

  it('should allow NewspaperData without Phase-2 fields (backward compatibility)', () => {
    const newspaper: NewspaperData = {
      newspaperId: 'test-456',
      name: 'Old Newspaper',
      userName: 'Old User',
      feedUrls: ['https://example.com/feed'],
      createdAt: '2025-12-01T00:00:00Z',
      updatedAt: '2025-12-01T00:00:00Z',
      viewCount: 5,
      isPublic: true,
      locale: 'en',
      // Phase-2 fields are optional - not included
    };

    expect(newspaper.languages).toBeUndefined();
    expect(newspaper.summary).toBeUndefined();
    expect(newspaper.newspaperDate).toBeUndefined();
  });

  it('should allow languages field as optional string array', () => {
    const newspaper: NewspaperData = {
      newspaperId: 'test-789',
      name: 'Multi-language Newspaper',
      userName: 'Test User',
      feedUrls: ['https://example.com/feed'],
      createdAt: '2025-12-10T00:00:00Z',
      updatedAt: '2025-12-10T00:00:00Z',
      viewCount: 0,
      isPublic: true,
      locale: 'en',
      languages: ['EN'], // Single language
    };

    expect(newspaper.languages).toEqual(['EN']);
    expect(Array.isArray(newspaper.languages)).toBe(true);
  });

  it('should allow summary field as optional string', () => {
    const newspaper: NewspaperData = {
      newspaperId: 'test-101',
      name: 'Newspaper with Summary',
      userName: 'Test User',
      feedUrls: ['https://example.com/feed'],
      createdAt: '2025-12-10T00:00:00Z',
      updatedAt: '2025-12-10T00:00:00Z',
      viewCount: 0,
      isPublic: true,
      locale: 'en',
      summary: 'A brief summary of the newspaper content',
    };

    expect(newspaper.summary).toBe('A brief summary of the newspaper content');
    expect(typeof newspaper.summary).toBe('string');
  });

  it('should allow newspaperDate field as optional string in YYYY-MM-DD format', () => {
    const newspaper: NewspaperData = {
      newspaperId: 'test-202',
      name: 'Historical Newspaper',
      userName: 'Test User',
      feedUrls: ['https://example.com/feed'],
      createdAt: '2025-12-10T00:00:00Z',
      updatedAt: '2025-12-10T00:00:00Z',
      viewCount: 0,
      isPublic: true,
      locale: 'en',
      newspaperDate: '2025-12-09',
    };

    expect(newspaper.newspaperDate).toBe('2025-12-09');
    expect(typeof newspaper.newspaperDate).toBe('string');
  });

  it('should allow articles field as optional Article array', () => {
    const article: Article = {
      title: 'Test Article',
      description: 'Test description',
      link: 'https://example.com/article',
      pubDate: '2025-12-10T00:00:00Z',
      imageUrl: 'https://example.com/image.jpg',
      importance: 85,
    };

    const newspaper: NewspaperData = {
      newspaperId: 'test-303',
      name: 'Newspaper with Articles',
      userName: 'Test User',
      feedUrls: ['https://example.com/feed'],
      articles: [article],
      createdAt: '2025-12-10T00:00:00Z',
      updatedAt: '2025-12-10T00:00:00Z',
      viewCount: 0,
      isPublic: true,
      locale: 'en',
    };

    expect(newspaper.articles).toHaveLength(1);
    expect(newspaper.articles?.[0]).toEqual(article);
  });
});
