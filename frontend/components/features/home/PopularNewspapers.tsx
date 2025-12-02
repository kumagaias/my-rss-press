import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { NewspaperData, Locale } from '@/types';
import { useTranslations, formatDate, formatNumber } from '@/lib/i18n';

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

  useEffect(() => {
    fetchNewspapers();
  }, [sortBy]);

  const fetchNewspapers = async () => {
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
  };

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
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
          <p className="text-gray-600">No newspapers found</p>
        </div>
      )}

      {!isLoading && !error && newspapers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newspapers.map((newspaper) => (
            <div
              key={newspaper.newspaperId}
              onClick={() => handleNewspaperClick(newspaper.newspaperId)}
              className="cursor-pointer"
            >
              <Card className="hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold line-clamp-2">
                    {newspaper.name}
                  </h3>
                  
                  <div className="text-sm text-gray-600 space-y-1">
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
                    <div className="flex flex-wrap gap-2">
                      {newspaper.feedUrls.slice(0, 3).map((url, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {new URL(url).hostname.replace('www.', '')}
                        </span>
                      ))}
                      {newspaper.feedUrls.length > 3 && (
                        <span className="text-xs text-gray-500">
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
