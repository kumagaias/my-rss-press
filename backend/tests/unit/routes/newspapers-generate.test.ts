import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { newspapersRouter } from '../../../src/routes/newspapers';
import * as feedSuggestionService from '../../../src/services/feedSuggestionService';
import * as rssFetcherService from '../../../src/services/rssFetcherService';
import * as importanceCalculator from '../../../src/services/importanceCalculator';
import * as languageDetectionService from '../../../src/services/languageDetectionService';
import * as summaryGenerationService from '../../../src/services/summaryGenerationService';
import * as articleLimiter from '../../../src/services/articleLimiter';

// Mock all services
vi.mock('../../../src/services/feedSuggestionService');
vi.mock('../../../src/services/rssFetcherService');
vi.mock('../../../src/services/importanceCalculator');
vi.mock('../../../src/services/languageDetectionService');
vi.mock('../../../src/services/summaryGenerationService');
vi.mock('../../../src/services/articleLimiter');
vi.mock('../../../src/services/newspaperService');
vi.mock('../../../src/services/feedUsageService');
vi.mock('../../../src/services/categoryService');
vi.mock('../../../src/models/newspaper');

describe('POST /api/newspapers/generate', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route('/api', newspapersRouter);
    vi.clearAllMocks();
  });

  it('should generate newspaper successfully with valid theme', async () => {
    // Mock feed suggestions
    vi.mocked(feedSuggestionService.suggestFeeds).mockResolvedValue({
      feeds: [
        { url: 'http://feed1.com', title: 'Feed 1', isDefault: false },
        { url: 'http://feed2.com', title: 'Feed 2', isDefault: true },
      ],
      newspaperName: 'Technology News',
    });

    // Mock article fetching
    vi.mocked(rssFetcherService.fetchArticlesForNewspaper).mockResolvedValue({
      articles: [
        {
          title: 'Article 1',
          description: 'Description 1',
          link: 'http://example.com/1',
          pubDate: '2025-01-01T00:00:00Z',
          importance: 10,
          feedSource: 'http://feed1.com',
        },
        {
          title: 'Article 2',
          description: 'Description 2',
          link: 'http://example.com/2',
          pubDate: '2025-01-01T00:00:00Z',
          importance: 9,
          feedSource: 'http://feed2.com',
        },
        {
          title: 'Article 3',
          description: 'Description 3',
          link: 'http://example.com/3',
          pubDate: '2025-01-01T00:00:00Z',
          importance: 8,
          feedSource: 'http://feed1.com',
        },
      ],
      feedLanguages: new Map([
        ['http://feed1.com', 'EN'],
        ['http://feed2.com', 'EN'],
      ]),
      feedTitles: new Map([
        ['http://feed1.com', 'Feed 1'],
        ['http://feed2.com', 'Feed 2'],
      ]),
    });

    // Mock article limiter
    vi.mocked(articleLimiter.limitDefaultFeedArticles).mockImplementation((articles) => articles);

    // Mock importance calculation
    vi.mocked(importanceCalculator.calculateImportance).mockResolvedValue([
      {
        title: 'Article 1',
        description: 'Description 1',
        link: 'http://example.com/1',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 10,
        feedSource: 'http://feed1.com',
      },
      {
        title: 'Article 2',
        description: 'Description 2',
        link: 'http://example.com/2',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 9,
        feedSource: 'http://feed2.com',
      },
      {
        title: 'Article 3',
        description: 'Description 3',
        link: 'http://example.com/3',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 8,
        feedSource: 'http://feed1.com',
      },
    ]);

    // Mock language detection
    vi.mocked(languageDetectionService.detectLanguages).mockResolvedValue(['EN']);

    // Mock summary generation
    vi.mocked(summaryGenerationService.generateSummaryWithRetry).mockResolvedValue('Test summary');

    const response = await app.request('/api/newspapers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'Technology', locale: 'en' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('articles');
    expect(data).toHaveProperty('feedUrls');
    expect(data).toHaveProperty('feedMetadata');
    expect(data).toHaveProperty('newspaperName');
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('languages');
    expect(data.articles.length).toBeGreaterThanOrEqual(3);
    // Only user-selected feeds are returned (default feeds excluded)
    expect(data.feedMetadata).toHaveLength(1);
    expect(data.feedMetadata[0].isDefault).toBeUndefined(); // isDefault not included for user feeds
    expect(data.languages).toEqual(['EN']);
    expect(data.newspaperName).toBe('Technology News');
  });

  it('should handle missing theme parameter', async () => {
    const response = await app.request('/api/newspapers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: 'en' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should mark default feeds correctly', async () => {
    vi.mocked(feedSuggestionService.suggestFeeds).mockResolvedValue({
      feeds: [
        { url: 'http://feed1.com', title: 'Feed 1', isDefault: false },
        { url: 'http://feed2.com', title: 'Feed 2', isDefault: true },
      ],
      newspaperName: 'Technology News',
    });

    vi.mocked(rssFetcherService.fetchArticlesForNewspaper).mockResolvedValue({
      articles: [
        {
          title: 'Article 1',
          description: 'Description 1',
          link: 'http://example.com/1',
          pubDate: '2025-01-01T00:00:00Z',
          importance: 10,
          feedSource: 'http://feed1.com',
        },
        {
          title: 'Article 2',
          description: 'Description 2',
          link: 'http://example.com/2',
          pubDate: '2025-01-01T00:00:00Z',
          importance: 9,
          feedSource: 'http://feed2.com',
        },
        {
          title: 'Article 3',
          description: 'Description 3',
          link: 'http://example.com/3',
          pubDate: '2025-01-01T00:00:00Z',
          importance: 8,
          feedSource: 'http://feed1.com',
        },
      ],
      feedLanguages: new Map([
        ['http://feed1.com', 'EN'],
        ['http://feed2.com', 'EN'],
      ]),
      feedTitles: new Map([
        ['http://feed1.com', 'Feed 1'],
        ['http://feed2.com', 'Feed 2'],
      ]),
    });

    vi.mocked(articleLimiter.limitDefaultFeedArticles).mockImplementation((articles) => articles);
    vi.mocked(importanceCalculator.calculateImportance).mockResolvedValue([
      {
        title: 'Article 1',
        description: 'Description 1',
        link: 'http://example.com/1',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 10,
        feedSource: 'http://feed1.com',
      },
      {
        title: 'Article 2',
        description: 'Description 2',
        link: 'http://example.com/2',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 9,
        feedSource: 'http://feed2.com',
      },
      {
        title: 'Article 3',
        description: 'Description 3',
        link: 'http://example.com/3',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 8,
        feedSource: 'http://feed1.com',
      },
    ]);
    vi.mocked(languageDetectionService.detectLanguages).mockResolvedValue(['EN']);
    vi.mocked(summaryGenerationService.generateSummaryWithRetry).mockResolvedValue('Test summary');

    const response = await app.request('/api/newspapers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'Technology', locale: 'en' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    // Only user-selected feeds are returned (default feeds excluded)
    expect(data.feedMetadata).toHaveLength(1);
    expect(data.feedMetadata[0].url).toBe('http://feed1.com');
    expect(data.feedMetadata[0].isDefault).toBeUndefined();
    expect(data.feedUrls).toHaveLength(1);
    expect(data.feedUrls[0]).toBe('http://feed1.com');
  });

  it('should call article limiter with correct parameters', async () => {
    vi.mocked(feedSuggestionService.suggestFeeds).mockResolvedValue({
      feeds: [
        { url: 'http://feed1.com', title: 'Feed 1', isDefault: true },
      ],
      newspaperName: 'Technology News',
    });

    const mockArticles = [
      {
        title: 'Article 1',
        description: 'Description 1',
        link: 'http://example.com/1',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 10,
        feedSource: 'http://feed1.com',
      },
      {
        title: 'Article 2',
        description: 'Description 2',
        link: 'http://example.com/2',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 9,
        feedSource: 'http://feed1.com',
      },
      {
        title: 'Article 3',
        description: 'Description 3',
        link: 'http://example.com/3',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 8,
        feedSource: 'http://feed1.com',
      },
    ];

    vi.mocked(rssFetcherService.fetchArticlesForNewspaper).mockResolvedValue({
      articles: mockArticles,
      feedLanguages: new Map([['http://feed1.com', 'EN']]),
      feedTitles: new Map([['http://feed1.com', 'Feed 1']]),
    });
    vi.mocked(articleLimiter.limitDefaultFeedArticles).mockImplementation((articles) => articles);
    vi.mocked(importanceCalculator.calculateImportance).mockResolvedValue(mockArticles);
    vi.mocked(languageDetectionService.detectLanguages).mockResolvedValue(['EN']);
    vi.mocked(summaryGenerationService.generateSummaryWithRetry).mockResolvedValue('Test summary');

    await app.request('/api/newspapers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'Technology', locale: 'en' }),
    });

    expect(articleLimiter.limitDefaultFeedArticles).toHaveBeenCalledWith(
      mockArticles,
      expect.arrayContaining([
        expect.objectContaining({ url: 'http://feed1.com', isDefault: true }),
      ])
    );
  });

  it('should handle feed suggestion errors gracefully', async () => {
    vi.mocked(feedSuggestionService.suggestFeeds).mockRejectedValue(new Error('Bedrock error'));

    const response = await app.request('/api/newspapers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'Technology', locale: 'en' }),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should handle article fetching errors gracefully', async () => {
    vi.mocked(feedSuggestionService.suggestFeeds).mockResolvedValue({
      feeds: [{ url: 'http://feed1.com', title: 'Feed 1', isDefault: false }],
      newspaperName: 'Technology News',
    });

    vi.mocked(rssFetcherService.fetchArticlesForNewspaper).mockRejectedValue(
      new Error('RSS fetch error')
    );

    const response = await app.request('/api/newspapers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'Technology', locale: 'en' }),
    });

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should work with Japanese locale', async () => {
    vi.mocked(feedSuggestionService.suggestFeeds).mockResolvedValue({
      feeds: [{ url: 'http://feed1.com', title: 'フィード1', isDefault: false }],
      newspaperName: 'テクノロジーニュース',
    });

    vi.mocked(rssFetcherService.fetchArticlesForNewspaper).mockResolvedValue({
      articles: [
        {
          title: '記事1',
          description: '説明1',
          link: 'http://example.com/1',
          pubDate: '2025-01-01T00:00:00Z',
          importance: 10,
          feedSource: 'http://feed1.com',
        },
        {
          title: '記事2',
          description: '説明2',
          link: 'http://example.com/2',
          pubDate: '2025-01-01T00:00:00Z',
          importance: 9,
          feedSource: 'http://feed1.com',
        },
        {
          title: '記事3',
          description: '説明3',
          link: 'http://example.com/3',
          pubDate: '2025-01-01T00:00:00Z',
          importance: 8,
          feedSource: 'http://feed1.com',
        },
      ],
      feedLanguages: new Map([['http://feed1.com', 'JP']]),
      feedTitles: new Map([['http://feed1.com', 'フィード1']]),
    });

    vi.mocked(articleLimiter.limitDefaultFeedArticles).mockImplementation((articles) => articles);
    vi.mocked(importanceCalculator.calculateImportance).mockResolvedValue([
      {
        title: '記事1',
        description: '説明1',
        link: 'http://example.com/1',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 10,
        feedSource: 'http://feed1.com',
      },
      {
        title: '記事2',
        description: '説明2',
        link: 'http://example.com/2',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 9,
        feedSource: 'http://feed1.com',
      },
      {
        title: '記事3',
        description: '説明3',
        link: 'http://example.com/3',
        pubDate: '2025-01-01T00:00:00Z',
        importance: 8,
        feedSource: 'http://feed1.com',
      },
    ]);
    vi.mocked(languageDetectionService.detectLanguages).mockResolvedValue(['JP']);
    vi.mocked(summaryGenerationService.generateSummaryWithRetry).mockResolvedValue('テスト要約');

    const response = await app.request('/api/newspapers/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: 'テクノロジー', locale: 'ja' }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.languages).toEqual(['JP']);
    expect(data.summary).toBe('テスト要約');
  });
});
