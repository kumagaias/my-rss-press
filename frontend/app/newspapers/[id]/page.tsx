'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NewspaperLayout } from '@/components/features/newspaper/NewspaperLayout';
import { Button } from '@/components/ui/Button';
import { detectLocale, useTranslations } from '@/lib/i18n';
import { getNewspaper, generateNewspaper } from '@/lib/api';
import type { Locale, Article, NewspaperData } from '@/types';

export default function NewspaperDetailPage() {
  const router = useRouter();
  const params = useParams();
  const newspaperId = params.id as string;

  const [locale, setLocale] = useState<Locale>('en');
  const t = useTranslations(locale);

  const [newspaper, setNewspaper] = useState<NewspaperData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocale(detectLocale());
    fetchNewspaperData();
  }, [newspaperId]);

  const fetchNewspaperData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch newspaper metadata
      const newspaperData = await getNewspaper(newspaperId);
      setNewspaper(newspaperData);

      // Generate articles from the saved feed URLs
      // Note: In a real implementation, you might want to cache the articles
      // or store them with the newspaper data
      const generatedArticles = await generateNewspaper(
        newspaperData.feedUrls,
        newspaperData.name
      );
      setArticles(generatedArticles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load newspaper');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t.loading}</p>
      </div>
    );
  }

  if (error || !newspaper) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Newspaper not found'}</p>
          <Button variant="outline" size="sm" onClick={handleBackToHome}>
            {t.backToHome}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header with actions */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToHome}
            >
              ← {t.backToHome}
            </Button>

            <div className="text-sm text-gray-600">
              {t.viewCount}: {newspaper.viewCount}
            </div>
          </div>
        </div>
      </header>

      {/* Newspaper Layout */}
      <div className="py-8">
        {articles.length > 0 ? (
          <NewspaperLayout
            articles={articles}
            newspaperName={newspaper.name}
            userName={newspaper.userName}
            createdAt={new Date(newspaper.createdAt)}
            locale={locale}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {locale === 'ja' 
                ? '記事を読み込んでいます...'
                : 'Loading articles...'}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
