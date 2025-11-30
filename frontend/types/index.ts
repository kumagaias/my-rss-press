// Common type definitions for the frontend application

export type Locale = 'en' | 'ja';

export interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  imageUrl?: string;
  importance: number;
}

export interface FeedSuggestion {
  url: string;
  title: string;
  reasoning: string;
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
