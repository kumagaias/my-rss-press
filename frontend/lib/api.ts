// API client for MyRSSPress backend

import type { Article, FeedSuggestion, FeedSuggestionsResponse, NewspaperData, NewspaperSettings } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

/**
 * Suggest RSS feeds based on a theme
 * Returns feed suggestions and AI-suggested newspaper name
 */
export async function suggestFeeds(theme: string, locale?: 'en' | 'ja'): Promise<FeedSuggestionsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/suggest-feeds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ theme, locale }),
  });

  if (!response.ok) {
    throw new Error(`Failed to suggest feeds: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    suggestions: data.suggestions || [],
    newspaperName: data.newspaperName || `${theme} Daily`,
  };
}

/**
 * Generate a newspaper from selected feeds
 */
export async function generateNewspaper(
  feedUrls: string[],
  theme: string,
  defaultFeedUrls: string[] = [],
  locale: 'en' | 'ja' = 'en'
): Promise<{ articles: Article[]; languages: string[]; summary: string | null }> {
  // Validate input
  if (!feedUrls || feedUrls.length === 0) {
    throw new Error('At least 1 feed URL is required');
  }
  if (feedUrls.length > 15) {
    throw new Error('Maximum 15 feed URLs allowed');
  }

  const response = await fetch(`${API_BASE_URL}/api/generate-newspaper`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      feedUrls,
      theme,
      defaultFeedUrls, // Pass default feed URLs for lower priority
      locale, // Language setting for the newspaper
      daysBack: 7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate newspaper: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    articles: data.articles || [],
    languages: data.languages || [],
    summary: data.summary || null,
  };
}

/**
 * Save a newspaper
 */
export async function saveNewspaper(
  settings: NewspaperSettings,
  feedUrls: string[],
  articles?: Article[],
  locale: 'en' | 'ja' = 'en',
  languages?: string[],
  summary?: string | null
): Promise<{ newspaperId: string; createdAt: string }> {
  const response = await fetch(`${API_BASE_URL}/api/newspapers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: settings.newspaperName,
      userName: settings.userName,
      feedUrls,
      articles,
      isPublic: settings.isPublic,
      locale, // Language setting for the newspaper
      languages, // Detected language tags (e.g., ["JP", "EN"])
      summary, // AI-generated summary (may be null)
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save newspaper: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get a newspaper by ID
 */
export async function getNewspaper(newspaperId: string): Promise<NewspaperData> {
  const response = await fetch(`${API_BASE_URL}/api/newspapers/${newspaperId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch newspaper: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get public newspapers
 */
export async function getPublicNewspapers(
  sortBy: 'popular' | 'recent' = 'popular',
  limit: number = 10,
  locale?: 'en' | 'ja'
): Promise<NewspaperData[]> {
  const localeParam = locale ? `&locale=${locale}` : '';
  const response = await fetch(
    `${API_BASE_URL}/api/newspapers?sort=${sortBy}&limit=${limit}${localeParam}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch newspapers: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.newspapers || [];
}

/**
 * Generate newspaper with one click (suggest feeds + generate newspaper)
 */
export async function generateNewspaperOneClick(
  theme: string,
  locale: 'en' | 'ja' = 'en'
): Promise<{
  articles: Article[];
  feedUrls: string[];
  feedMetadata: Array<{ url: string; title: string; isDefault: boolean; language?: string }>;
  newspaperName: string;
  summary: string | null;
  languages: string[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/newspapers/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ theme, locale }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate newspaper: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
