// API client for MyRSSPress backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export interface FeedSuggestion {
  url: string;
  title: string;
  reasoning: string;
}

export interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  importance: number;
}

export interface NewspaperData {
  newspaperId: string;
  name: string;
  userName: string;
  feedUrls: string[];
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isPublic: boolean;
}

export interface NewspaperSettings {
  newspaperName: string;
  userName: string;
  isPublic: boolean;
}

/**
 * Suggest RSS feeds based on a theme
 */
export async function suggestFeeds(theme: string): Promise<FeedSuggestion[]> {
  const response = await fetch(`${API_BASE_URL}/api/suggest-feeds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ theme }),
  });

  if (!response.ok) {
    throw new Error('Failed to suggest feeds');
  }

  const data = await response.json();
  return data.suggestions || [];
}

/**
 * Generate a newspaper from selected feeds
 */
export async function generateNewspaper(
  feedUrls: string[],
  theme: string
): Promise<Article[]> {
  const response = await fetch(`${API_BASE_URL}/api/generate-newspaper`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      feedUrls,
      theme,
      daysBack: 3,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate newspaper');
  }

  const data = await response.json();
  return data.articles || [];
}

/**
 * Save a newspaper
 */
export async function saveNewspaper(
  settings: NewspaperSettings,
  feedUrls: string[]
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
      isPublic: settings.isPublic,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save newspaper');
  }

  return await response.json();
}

/**
 * Get a newspaper by ID
 */
export async function getNewspaper(newspaperId: string): Promise<NewspaperData> {
  const response = await fetch(`${API_BASE_URL}/api/newspapers/${newspaperId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch newspaper');
  }

  return await response.json();
}

/**
 * Get public newspapers
 */
export async function getPublicNewspapers(
  sortBy: 'popular' | 'recent' = 'popular',
  limit: number = 10
): Promise<NewspaperData[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/newspapers?sort=${sortBy}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch newspapers');
  }

  const data = await response.json();
  return data.newspapers || [];
}
