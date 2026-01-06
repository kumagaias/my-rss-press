/**
 * Placeholder images for articles without images
 * Organized by category (1 image per category)
 */

export type CategoryKey = 
  | 'technology'
  | 'business'
  | 'sports'
  | 'entertainment'
  | 'science'
  | 'health'
  | 'politics'
  | 'world'
  | 'lifestyle'
  | 'food'
  | 'general';

/**
 * Category keywords for matching articles to placeholder images
 */
const CATEGORY_KEYWORDS: Record<CategoryKey, string[]> = {
  technology: ['tech', 'technology', 'software', 'hardware', 'ai', 'computer', 'digital', 'internet', 'cyber', 'innovation'],
  business: ['business', 'economy', 'finance', 'market', 'stock', 'trade', 'corporate', 'startup', 'investment', 'entrepreneur'],
  sports: ['sports', 'football', 'soccer', 'basketball', 'baseball', 'tennis', 'golf', 'olympics', 'athlete', 'game'],
  entertainment: ['entertainment', 'movie', 'film', 'music', 'celebrity', 'tv', 'show', 'concert', 'theater', 'arts'],
  science: ['science', 'research', 'study', 'discovery', 'space', 'astronomy', 'physics', 'chemistry', 'biology', 'lab'],
  health: ['health', 'medical', 'medicine', 'doctor', 'hospital', 'wellness', 'fitness', 'nutrition', 'disease', 'treatment'],
  politics: ['politics', 'government', 'election', 'policy', 'law', 'congress', 'senate', 'parliament', 'vote', 'legislation'],
  world: ['world', 'international', 'global', 'foreign', 'country', 'nation', 'diplomatic', 'embassy', 'united nations'],
  lifestyle: ['lifestyle', 'living', 'home', 'fashion', 'design', 'travel', 'culture', 'hobby', 'leisure', 'style'],
  food: ['food', 'restaurant', 'cooking', 'recipe', 'chef', 'cuisine', 'dining', 'culinary', 'meal', 'dish'],
  general: [], // Fallback category
};

/**
 * Get placeholder image path for an article
 * Currently uses general.jpg for all categories (future: category-specific images)
 * @param title - Article title
 * @param description - Article description
 * @returns Path to placeholder image (1024x1024px)
 */
export function getPlaceholderImage(title: string, description: string = ''): string {
  // For now, always use general.jpg
  // Future: Implement category-specific images when available
  return '/images/placeholders/general.jpg';
  
  /* Future implementation with category-specific images:
  const text = `${title} ${description}`.toLowerCase();
  
  // Find matching category
  let matchedCategory: CategoryKey = 'general';
  let maxMatches = 0;
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      matchedCategory = category as CategoryKey;
    }
  }
  
  return `/images/placeholders/${matchedCategory}.jpg`;
  */
}

/**
 * Preload placeholder images for better performance
 * Call this on app initialization
 */
export function preloadPlaceholderImages(): void {
  // Currently only general.jpg is available
  const img = new Image();
  img.src = '/images/placeholders/general.jpg';
  
  /* Future: Preload all category images when available
  const categories: CategoryKey[] = [
    'technology', 'business', 'sports', 'entertainment', 'science',
    'health', 'politics', 'world', 'lifestyle', 'food', 'general'
  ];
  
  categories.forEach(category => {
    const img = new Image();
    img.src = `/images/placeholders/${category}.jpg`;
  });
  */
}
