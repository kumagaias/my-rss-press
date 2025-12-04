/**
 * Test data fixtures for E2E tests
 * Contains sample themes, feed URLs, and other test data
 */

export const testThemes = {
  technology: {
    en: 'Technology',
    ja: 'テクノロジー',
  },
  sports: {
    en: 'Sports',
    ja: 'スポーツ',
  },
  business: {
    en: 'Business',
    ja: 'ビジネス',
  },
};

export const testFeedUrls = [
  'https://example.com/tech-feed',
  'https://example.com/news-feed',
  'https://example.com/blog-feed',
];

export const testNewspaperSettings = {
  name: 'Test Newspaper',
  userName: 'Test User',
  isPublic: true,
};

export const invalidInputs = {
  emptyString: '',
  whitespaceOnly: '   ',
  tooLong: 'a'.repeat(1000),
};
