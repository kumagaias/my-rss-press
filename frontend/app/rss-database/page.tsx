'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { detectLocale, useTranslations } from '@/lib/i18n';
import type { Locale } from '@/types';

interface Category {
  id: string;
  name: string;
  description: string;
  locale: 'en' | 'ja';
  keywords: string[];
  order: number;
  feedCount: number;
}

interface Feed {
  url: string;
  title: string;
  description?: string;
  language?: string;
  priority: number;
}

interface CategoriesResponse {
  categories: Category[];
  totalFeeds: number;
}

interface FeedsResponse {
  feeds: Feed[];
}

export default function RssDatabasePage() {
  const router = useRouter();
  
  // Get locale from localStorage (set by LayoutClient)
  const [locale, setLocale] = useState<Locale>(() => {
    // During SSR, return 'en' as default
    if (typeof window === 'undefined') return 'en';
    
    // On client, check localStorage
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    return savedLocale || detectLocale();
  });
  
  const t = useTranslations(locale);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalFeeds, setTotalFeeds] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryFeeds, setCategoryFeeds] = useState<Record<string, Feed[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync locale from localStorage (updated by LayoutClient)
  useEffect(() => {
    // Check localStorage periodically for locale changes
    const checkLocale = () => {
      const savedLocale = localStorage.getItem('locale') as Locale | null;
      if (savedLocale && savedLocale !== locale) {
        console.log('[RSS Database] Locale changed to:', savedLocale);
        setLocale(savedLocale);
      }
    };

    // Check immediately on mount
    checkLocale();

    // Check every 500ms for locale changes
    const interval = setInterval(checkLocale, 500);

    return () => {
      clearInterval(interval);
    };
  }, [locale]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}/api/categories?locale=${locale}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data: CategoriesResponse = await response.json();
        setCategories(data.categories);
        setTotalFeeds(data.totalFeeds);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load RSS database');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [locale]);

  // Fetch feeds for a category
  const fetchCategoryFeeds = async (categoryId: string) => {
    if (categoryFeeds[categoryId]) {
      // Already fetched
      return;
    }

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/categories/${categoryId}/feeds`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch feeds');
      }
      
      const data: FeedsResponse = await response.json();
      setCategoryFeeds(prev => ({
        ...prev,
        [categoryId]: data.feeds,
      }));
    } catch (err) {
      console.error('Error fetching feeds:', err);
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
      fetchCategoryFeeds(categoryId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-black text-white font-serif font-bold border-2 border-black hover:bg-gray-800"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-4 border-black shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-serif font-bold text-gray-900">
                {t.rssDatabase}
              </h1>
              <p className="mt-2 text-gray-600">
                {t.rssFeedsCollected(totalFeeds)}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white font-serif font-bold border-2 border-black hover:bg-gray-800 transition-colors"
            >
              {t.backToHome}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white border-2 border-black shadow-sm overflow-hidden"
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-serif font-bold text-gray-900">
                    {category.name}
                  </h2>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
                    {category.feedCount} {t.feeds}
                  </span>
                </div>
                <svg
                  className={`w-6 h-6 transition-transform ${
                    expandedCategory === category.id ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Category Description */}
              {category.description && (
                <div className="px-6 pb-2">
                  <p className="text-gray-600 text-sm">{category.description}</p>
                </div>
              )}

              {/* Feeds List */}
              {expandedCategory === category.id && (
                <div className="border-t-2 border-gray-200">
                  {categoryFeeds[category.id] ? (
                    <div className="divide-y divide-gray-200">
                      {categoryFeeds[category.id].map((feed) => (
                        <div
                          key={feed.url}
                          className="px-6 py-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-serif font-bold text-gray-900 mb-1">
                                {feed.title}
                              </h3>
                              {feed.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {feed.description}
                                </p>
                              )}
                              <a
                                href={feed.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 break-all"
                              >
                                {feed.url}
                              </a>
                            </div>
                            {feed.language && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded flex-shrink-0">
                                {feed.language}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {t.noCategories}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
