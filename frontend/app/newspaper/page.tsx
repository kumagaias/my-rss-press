'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NewspaperLayout } from '@/components/features/newspaper/NewspaperLayout';
import { NewspaperSettingsModal } from '@/components/features/newspaper/NewspaperSettings';
import { Button } from '@/components/ui/Button';
import { detectLocale, useTranslations } from '@/lib/i18n';
import { saveNewspaper, getNewspaper, generateNewspaper } from '@/lib/api';
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
  const [isRegeneratingArticles, setIsRegeneratingArticles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save locale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  // Load data from sessionStorage or API
  useEffect(() => {
    // Try to get saved locale from localStorage first, then sessionStorage, then detect
    const localStorageLocale = localStorage.getItem('locale') as Locale | null;
    const sessionLocale = sessionStorage.getItem('newspaperLocale') as Locale | null;
    const detectedLocale = localStorageLocale || sessionLocale || detectLocale();
    setLocale(detectedLocale);

    const loadNewspaper = async () => {
      // If newspaperId is provided, load from API
      if (newspaperId) {
        setIsLoading(true);
        setIsSaved(true); // Already saved newspaper
        try {
          const newspaper = await getNewspaper(newspaperId);
          
          // Check if articles exist
          if (!newspaper.articles || newspaper.articles.length === 0) {
            // Articles are missing, but we have feedUrls
            // We'll show a message and allow user to regenerate
            setFeedUrls(newspaper.feedUrls || []);
            setNewspaperName(newspaper.name || '');
            setUserName(newspaper.userName || '');
            setCreatedAt(new Date(newspaper.createdAt));
            setViewCount(newspaper.viewCount || 0);
            setArticles([]); // Empty articles
            setIsLoading(false);
            return;
          }
          
          setArticles(newspaper.articles);
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
      const languagesData = sessionStorage.getItem('newspaperLanguages');
      const summaryData = sessionStorage.getItem('newspaperSummary');

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

      // Store languages and summary for later use when saving
      if (languagesData) {
        sessionStorage.setItem('detectedLanguages', languagesData);
      }
      if (summaryData) {
        sessionStorage.setItem('newspaperSummary', summaryData);
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
      // Get detected languages and summary from sessionStorage
      const languagesData = sessionStorage.getItem('detectedLanguages');
      const languages = languagesData ? JSON.parse(languagesData) : undefined;
      const summary = sessionStorage.getItem('newspaperSummary') ?? null;
      
      const result = await saveNewspaper(settings, feedUrls, articles, locale, languages, summary);
      
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

  const handleRegenerateArticles = async () => {
    if (feedUrls.length === 0) {
      setError(t.feedRequired);
      return;
    }

    setError(null);
    setIsRegeneratingArticles(true);

    try {
      const { articles: regeneratedArticles, languages, summary } = await generateNewspaper(feedUrls, newspaperName || 'News', [], locale);
      setArticles(regeneratedArticles);
      
      // Store detected languages and summary for later use when saving
      sessionStorage.setItem('detectedLanguages', JSON.stringify(languages));
      if (summary !== null && summary !== undefined) {
        sessionStorage.setItem('newspaperSummary', summary);
      }
      
      // Mark as not saved so user can save the regenerated version
      setIsSaved(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate articles';
      setError(errorMessage);
      console.error('Article regeneration error:', err);
    } finally {
      setIsRegeneratingArticles(false);
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

  if (articles.length === 0 && !newspaperId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t.loading}</p>
      </div>
    );
  }

  // Show regenerate option if newspaper exists but has no articles
  if (articles.length === 0 && newspaperId && feedUrls.length > 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handleBackToHome}>
                ← {t.backToHome}
              </Button>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocale('ja')}
                  className={`px-3 py-1 text-sm font-serif font-bold border-2 border-black transition-colors ${
                    locale === 'ja' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  日本語
                </button>
                <button
                  onClick={() => setLocale('en')}
                  className={`px-3 py-1 text-sm font-serif font-bold border-2 border-black transition-colors ${
                    locale === 'en' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white border-4 border-black shadow-lg p-8 text-center">
            <h2 className="text-2xl font-serif font-black mb-4">{newspaperName}</h2>
            <p className="text-gray-600 mb-6">
              {locale === 'ja'
                ? 'この新聞には記事がありません。フィードから記事を生成できます。'
                : 'This newspaper has no articles. You can generate articles from the feeds.'}
            </p>
            <div className="space-y-4">
              <div className="text-left">
                <h3 className="font-serif font-bold mb-2">
                  {locale === 'ja' ? 'フィード:' : 'Feeds:'}
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {feedUrls.map((url, index) => (
                    <li key={index} className="break-all">{url}</li>
                  ))}
                </ul>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleRegenerateArticles}
                disabled={isRegeneratingArticles}
                loading={isRegeneratingArticles}
                className="w-full"
              >
                {isRegeneratingArticles
                  ? t.loading
                  : locale === 'ja'
                  ? '記事を生成'
                  : 'Generate Articles'}
              </Button>
              {error && (
                <div className="text-red-600 text-sm mt-2">{error}</div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header with actions */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToHome}
            >
              ← {t.backToHome}
            </Button>

            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
              {/* Language switcher */}
              <div className="flex gap-2">
                <button
                  onClick={() => setLocale('ja')}
                  className={`px-3 py-2 min-h-[44px] text-sm font-serif font-bold border-2 border-black transition-colors ${
                    locale === 'ja'
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  日本語
                </button>
                <button
                  onClick={() => setLocale('en')}
                  className={`px-3 py-2 min-h-[44px] text-sm font-serif font-bold border-2 border-black transition-colors ${
                    locale === 'en'
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  EN
                </button>
              </div>
              {/* Show view count for saved newspapers */}
              {newspaperId && viewCount > 0 && (
                <span className="text-gray-600 text-sm font-medium whitespace-nowrap">
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
