import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { NewspaperData, Locale } from '@/types';
import { useTranslations, formatDate, formatNumber } from '@/lib/i18n';
import { getHostnameFromUrl } from '@/lib/utils';

interface PopularNewspapersProps {
  locale: Locale;
  onNewspaperClick?: (newspaperId: string) => void;
}

export function PopularNewspapers({ locale, onNewspaperClick }: PopularNewspapersProps) {
  const t = useTranslations(locale);
  const [newspapers, setNewspapers] = useState<NewspaperData[]>([]);
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNewspapers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBaseUrl}/api/newspapers?sort=${sortBy}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch newspapers');
      }
      
      const data = await response.json();
      setNewspapers(data.newspapers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchNewspapers();
  }, [fetchNewspapers]);

  const handleSortChange = (newSort: 'popular' | 'recent') => {
    setSortBy(newSort);
  };

  const handleNewspaperClick = (newspaperId: string) => {
    if (onNewspaperClick) {
      onNewspaperClick(newspaperId);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
        <h2 className="text-3xl font-serif font-black">
          {sortBy === 'popular' ? t.popularNewspapers : t.recentNewspapers}
        </h2>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'popular' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('popular')}
          >
            {t.popular}
          </Button>
          <Button
            variant={sortBy === 'recent' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('recent')}
          >
            {t.recent}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-600">{t.loading}</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">{t.errorOccurred}: {error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNewspapers}
            className="mt-4"
          >
            {t.tryAgain}
          </Button>
        </div>
      )}

      {!isLoading && !error && newspapers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">{t.noNewspapersFound}</p>
        </div>
      )}

      {!isLoading && !error && newspapers.length > 0 && (
        <div className="space-y-4">
          {newspapers.map((newspaper) => (
            <div
              key={newspaper.newspaperId}
              onClick={() => handleNewspaperClick(newspaper.newspaperId)}
              className="cursor-pointer relative"
            >
              <Card className="hover:shadow-lg transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-serif font-black line-clamp-2 border-b border-gray-300 pb-2 flex-1">
                      {newspaper.name}
                    </h3>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 font-serif italic whitespace-nowrap">
                      Coming Soon
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-800 space-y-1 font-serif">
                    <p>
                      {t.createdBy}: {newspaper.userName || 'Anonymous'}
                    </p>
                    <p>
                      {t.createdAt}: {formatDate(newspaper.createdAt, locale)}
                    </p>
                    <p>
                      {t.viewCount}: {formatNumber(newspaper.viewCount, locale)}
                    </p>
                  </div>

                  {newspaper.feedUrls && newspaper.feedUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-300">
                      {newspaper.feedUrls.slice(0, 3).map((url, index) => (
                        <span
                          key={index}
                          className="text-xs bg-white border border-black px-2 py-1 font-mono"
                        >
                          {getHostnameFromUrl(url)}
                        </span>
                      ))}
                      {newspaper.feedUrls.length > 3 && (
                        <span className="text-xs text-gray-700 font-serif italic">
                          +{newspaper.feedUrls.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
