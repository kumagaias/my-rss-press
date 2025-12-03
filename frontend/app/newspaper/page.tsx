'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NewspaperLayout } from '@/components/features/newspaper/NewspaperLayout';
import { NewspaperSettingsModal } from '@/components/features/newspaper/NewspaperSettings';
import { Button } from '@/components/ui/Button';
import { detectLocale, useTranslations } from '@/lib/i18n';
import { saveNewspaper, getNewspaper } from '@/lib/api';
import type { Locale, Article, NewspaperSettings } from '@/types';

function NewspaperPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const newspaperId = searchParams.get('id');
  
  const [locale, setLocale] = useState<Locale>('en');
  const t = useTranslations(locale);

  const [articles, setArticles] = useState<Article[]>([]);
  const [feedUrls, setFeedUrls] = useState<string[]>([]);
  const [newspaperName, setNewspaperName] = useState('');
  const [userName, setUserName] = useState('');
  const [createdAt, setCreatedAt] = useState<Date>(new Date());
  const [viewCount, setViewCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from sessionStorage or API
  useEffect(() => {
    const detectedLocale = detectLocale();
    setLocale(detectedLocale);

    const loadNewspaper = async () => {
      // If newspaperId is provided, load from API
      if (newspaperId) {
        setIsLoading(true);
        setIsSaved(true); // Already saved newspaper
        try {
          const newspaper = await getNewspaper(newspaperId);
          setArticles(newspaper.articles || []);
          setFeedUrls(newspaper.feedUrls || []);
          setNewspaperName(newspaper.name || '');
          setUserName(newspaper.userName || '');
          setCreatedAt(new Date(newspaper.createdAt));
          setViewCount(newspaper.viewCount || 0);
        } catch (err) {
          setError(err instanceof Error ? err.message : t.newspaperNotFound);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Otherwise, load from sessionStorage (newly generated newspaper)
      const articlesData = sessionStorage.getItem('newspaperArticles');
      const themeData = sessionStorage.getItem('newspaperTheme');
      const feedsData = sessionStorage.getItem('newspaperFeeds');

      if (articlesData) {
        const parsedArticles = JSON.parse(articlesData);
        setArticles(parsedArticles);
      }

      if (themeData) {
        // Generate default newspaper name from theme
        const defaultName = detectedLocale === 'ja' 
          ? `${themeData}の新聞`
          : `${themeData} Newspaper`;
        setNewspaperName(defaultName);
      }

      if (feedsData) {
        setFeedUrls(JSON.parse(feedsData));
      }

      // If no articles and no newspaperId, redirect to home
      if (!articlesData && !newspaperId) {
        router.push('/');
      }
    };

    loadNewspaper();
  }, [router, newspaperId, t]);

  const handleSaveClick = () => {
    setShowSettingsModal(true);
  };

  const handleSaveNewspaper = async (settings: NewspaperSettings) => {
    setError(null);
    setIsSaving(true);

    try {
      const result = await saveNewspaper(settings, feedUrls);
      
      setNewspaperName(settings.newspaperName);
      setUserName(settings.userName);
      setIsSaved(true);
      setShowSettingsModal(false);

      // Store newspaper ID for future reference
      sessionStorage.setItem('savedNewspaperId', result.newspaperId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save newspaper');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToHome = () => {
    // Clear session storage
    sessionStorage.removeItem('newspaperArticles');
    sessionStorage.removeItem('newspaperTheme');
    sessionStorage.removeItem('newspaperFeeds');
    sessionStorage.removeItem('savedNewspaperId');
    
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={handleBackToHome}>
            {t.backToHome}
          </Button>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t.loading}</p>
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

            <div className="flex items-center gap-4">
              {/* Show view count for saved newspapers */}
              {newspaperId && viewCount > 0 && (
                <span className="text-gray-600 text-sm font-medium">
                  {t.viewCount}: {viewCount}
                </span>
              )}
              
              {isSaved && !newspaperId && (
                <span className="text-green-600 text-sm font-medium">
                  ✓ {t.saved}
                </span>
              )}
              
              {!isSaved && !newspaperId && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveClick}
                  disabled={isSaving}
                >
                  {isSaving ? t.loading : t.saveNewspaper}
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </header>

      {/* Newspaper Layout */}
      <div className="py-8">
        <NewspaperLayout
          articles={articles}
          newspaperName={newspaperName}
          userName={userName}
          createdAt={createdAt}
          locale={locale}
        />
      </div>

      {/* Settings Modal */}
      <NewspaperSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleSaveNewspaper}
        locale={locale}
        defaultName={newspaperName}
      />

      {/* Footer */}
      <footer className="bg-black text-white border-t-4 border-black mt-12">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center text-xs font-serif">
            <p>© 2025 MyRSSPress</p>
            <p>{t.footerTagline}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function NewspaperPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <NewspaperPageInner />
    </Suspense>
  );
}
