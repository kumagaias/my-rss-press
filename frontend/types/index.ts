// Common type definitions for the frontend application

export type Locale = 'en' | 'ja';

export interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  importance: number;
}

export interface FeedSuggestion {
  url: string;
  title: string;
  reasoning: string;
  isDefault?: boolean; // Flag to indicate if this is a default/fallback feed
}

export interface NewspaperData {
  newspaperId: string;
  name: string;
  userName: string;
  feedUrls: string[];
  articles?: Article[];
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
