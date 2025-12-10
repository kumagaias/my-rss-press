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
  locale: Locale; // Language setting for the newspaper (en or ja)
  
  // Phase-2 new fields (all optional for backward compatibility)
  languages?: string[]; // Language tags detected from articles (e.g., ["JP", "EN"])
  summary?: string; // AI-generated summary (100-200 characters)
  newspaperDate?: string; // Date of the newspaper (YYYY-MM-DD format)
}

export interface NewspaperSettings {
  newspaperName: string;
  userName: string;
  isPublic: boolean;
}
