/**
 * Newspaper and Article type definitions
 */

export interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  importance: number;
  feedSource?: string; // RSS feed URL that this article came from (for language detection)
  feedTitle?: string; // Feed title from RSS metadata (for display)
}

export type Locale = 'en' | 'ja';

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
  editorialColumn?: string; // AI-generated editorial column (Tensei Jingo style)
}
