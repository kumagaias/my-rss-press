/**
 * Google Books API Client
 * 
 * Provides interface to search books using Google Books API.
 * No API key required for basic search functionality.
 */

export interface GoogleBooksSearchParams {
  query: string;
  maxResults?: number;
  langRestrict?: string; // 'en' or 'ja'
}

export interface BookData {
  title: string;
  authors: string[];
  description?: string;
  thumbnail?: string;
  infoLink: string;
}

interface GoogleBooksVolumeInfo {
  title?: string;
  authors?: string[];
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  infoLink?: string;
}

interface GoogleBooksItem {
  volumeInfo?: GoogleBooksVolumeInfo;
}

interface GoogleBooksResponse {
  items?: GoogleBooksItem[];
}

/**
 * Search books using Google Books API
 */
export async function searchBooks(params: GoogleBooksSearchParams): Promise<BookData[]> {
  const { query, maxResults = 10, langRestrict } = params;

  // Build query parameters
  const queryParams = new URLSearchParams({
    q: query,
    maxResults: maxResults.toString(),
  });

  if (langRestrict) {
    queryParams.append('langRestrict', langRestrict);
  }

  const url = `https://www.googleapis.com/books/v1/volumes?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Google Books API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json() as GoogleBooksResponse;
    return transformResponse(data);
  } catch (error) {
    console.error('Failed to fetch from Google Books API:', error);
    return [];
  }
}

/**
 * Transform Google Books API response to internal format
 */
export function transformResponse(response: GoogleBooksResponse): BookData[] {
  if (!response.items || !Array.isArray(response.items)) {
    return [];
  }

  const books: BookData[] = [];
  
  for (const item of response.items) {
    const volumeInfo = item.volumeInfo;
    
    // Validate required fields
    if (!volumeInfo?.title || !volumeInfo?.authors || volumeInfo.authors.length === 0) {
      continue;
    }

    books.push({
      title: volumeInfo.title,
      authors: volumeInfo.authors,
      description: volumeInfo.description,
      thumbnail: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
      infoLink: volumeInfo.infoLink || `https://www.google.com/search?q=${encodeURIComponent(volumeInfo.title)}`,
    });
  }

  return books;
}
