// Data models for newspaper-related entities

/**
 * Supported locales for newspapers
 * - ja: Japanese (Asia/Tokyo, UTC+9)
 * - en-US: English (US) (America/New_York, UTC-5/-4)
 * - en-GB: English (UK) (Europe/London, UTC+0/+1)
 */
export type Locale = 'ja' | 'en-US' | 'en-GB';

/**
 * Image attribution information for Unsplash photos
 */
export interface ImageAttribution {
  photographer: string;
  photographerUrl: string;
  photoUrl: string;
}

/**
 * Article data structure
 */
export interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string; // ISO 8601 format
  imageUrl?: string;
  importance: number;
  feedSource?: string; // Optional for backward compatibility
  
  // Phase 2: Unsplash attribution
  imageAttribution?: ImageAttribution;
}

/**
 * Newspaper data structure
 * Phase 2 extensions:
 * - seriesId: UUID for newspaper series
 * - publishDate: Publication date (YYYY-MM-DD)
 * - locale: Language and timezone setting
 * - summary: AI-generated 3-line summary
 * 
 * Note: Phase 2 fields are optional for backward compatibility during migration
 */
export interface NewspaperData {
  // Phase 1 fields
  newspaperId: string; // Format: {seriesId}_{YYYY-MM-DD} in Phase 2
  name: string;
  userName: string;
  feedUrls: string[];
  articles?: Article[];
  createdAt: string; // UTC (ISO 8601)
  updatedAt: string; // UTC (ISO 8601)
  viewCount: number;
  isPublic: boolean;
  locale: Locale; // Language and timezone setting
  
  // Phase 2 additions (optional for backward compatibility)
  seriesId?: string; // UUID for newspaper series
  publishDate?: string; // YYYY-MM-DD format
  summary?: string; // AI-generated 3-line summary
}
