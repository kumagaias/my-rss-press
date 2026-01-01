/**
 * Category entity for dynamic category management
 */
export interface Category {
  categoryId: string;
  parentCategory?: string;
  locale: 'en' | 'ja';
  displayName: string;
  keywords: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Feed entity for RSS feed management
 */
export interface Feed {
  categoryId: string;
  url: string;
  title: string;
  description: string;
  language: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Category with associated feeds
 */
export interface CategoryWithFeeds extends Category {
  feeds: Feed[];
}

/**
 * Input type for creating a new category (without timestamps)
 */
export type CreateCategoryInput = Omit<Category, 'createdAt' | 'updatedAt'>;

/**
 * Input type for creating a new feed (without timestamps)
 */
export type CreateFeedInput = Omit<Feed, 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating a category (partial, without timestamps)
 */
export type UpdateCategoryInput = Partial<Omit<Category, 'categoryId' | 'createdAt' | 'updatedAt'>>;

/**
 * Input type for updating a feed (partial, without timestamps)
 */
export type UpdateFeedInput = Partial<Omit<Feed, 'categoryId' | 'url' | 'createdAt' | 'updatedAt'>>;
