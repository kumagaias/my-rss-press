'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NewspaperLayout } from '@/components/features/newspaper/NewspaperLayout';
import { NewspaperSettingsModal } from '@/components/features/newspaper/NewspaperSettings';
import DateNavigation from '@/components/features/newspaper/DateNavigation';
import { detectLocale, useTranslations, type Locale } from '@/lib/i18n';
import { saveNewspaper } from '@/lib/api';
import type { NewspaperSettings } from '@/types';

interface Article {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  feedTitle?: string;
  importance: number;
}

interface Newspaper {
  newspaperId: string;
  name: string;
  userName?: string;
  feedUrls: string[];
  theme?: string;
  articles: Article[];
  newspaperDate: string;
  summary?: string;
  languages?: string[];
}

function NewspaperContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize locale from sessionStorage first, then fall back to detectLocale()
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = sessionStorage.getItem('newspaperLocale') as Locale | null;
      return savedLocale || detectLocale();
    }
    return detectLocale();
  });
  const t = useTranslations(locale);
  
  const [newspaper, setNewspaper] = useState<Newspaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [feedMetadata, setFeedMetadata] = useState<Array<{ url: string; title?: string; isDefault?: boolean }>>([]);
  const [isDateChanging, setIsDateChanging] = useState(false);

  // Get id and date from query params
  useEffect(() => {
    const idParam = searchParams.get('id');
    const dateParam = searchParams.get('date');
    
    if (idParam) {
      setId(idParam);
      
      // If no date parameter and it's a saved newspaper (not temp-*),
      // set today's date as default
      if (!dateParam && !idParam.startsWith('temp-')) {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        setDate(today);
      }
    }
    if (dateParam) {
      setDate(dateParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // If no id, try to load from sessionStorage (newly generated newspaper)
    if (!id) {
      try {
        const articlesJson = sessionStorage.getItem('newspaperArticles');
        const theme = sessionStorage.getItem('newspaperTheme');
        const newspaperName = sessionStorage.getItem('newspaperName'); // AI-suggested name
        const feedsJson = sessionStorage.getItem('newspaperFeeds');
        const languagesJson = sessionStorage.getItem('newspaperLanguages');
        const summary = sessionStorage.getItem('newspaperSummary');
        const feedMetadataJson = sessionStorage.getItem('newspaperFeedMetadata');

        // Load feed metadata
        if (feedMetadataJson) {
          try {
            const metadata = JSON.parse(feedMetadataJson);
            setFeedMetadata(metadata);
          } catch (err) {
            console.error('Error parsing feed metadata:', err);
          }
        }

        if (articlesJson && theme && feedsJson) {
          const articles = JSON.parse(articlesJson);
          const feedUrls = JSON.parse(feedsJson);
          const languages = languagesJson ? JSON.parse(languagesJson) : [];

          // Create newspaper object from sessionStorage
          const newspaperData: Newspaper = {
            newspaperId: 'temp-' + Date.now(), // Temporary ID for unsaved newspaper
            name: newspaperName || theme, // Use AI-suggested name or fallback to theme
            userName: 'Anonymous',
            feedUrls,
            theme,
            articles,
            newspaperDate: new Date().toISOString(),
            summary: summary || undefined,
            languages,
          };

          setNewspaper(newspaperData);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error loading from sessionStorage:', err);
      }

      // If sessionStorage is empty, show error
      setError(t.newspaperNotFound);
      setLoading(false);
      return;
    }

    const fetchNewspaper = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        let url = `${apiBaseUrl}/api/newspapers/${id}`;
        
        // Add date parameter if provided
        if (date) {
          // Validate date format (YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(date)) {
            setError(t.error);
            setLoading(false);
            setIsDateChanging(false);
            return;
          }
          url += `/${date}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          
          if (response.status === 400) {
            // Date validation errors
            setError(errorData.error || t.error);
          } else if (response.status === 404) {
            setError(t.newspaperNotFound);
          } else {
            setError(t.newspaperLoadError);
          }
          setLoading(false);
          setIsDateChanging(false);
          return;
        }

        const data = await response.json();
        setNewspaper(data);
      } catch (err) {
        console.error('Error fetching newspaper:', err);
        setError(t.newspaperLoadError);
      } finally {
        setLoading(false);
        setIsDateChanging(false);
      }
    };

    fetchNewspaper();
  }, [id, date, t]);

  const handleDateChange = (newDate: string) => {
    // Set loading state for date change
    setIsDateChanging(true);
    // Navigate to the new date using query parameter
    router.push(`/newspaper?id=${id}&date=${newDate}`);
  };

  const handleSaveClick = () => {
    setIsSettingsOpen(true);
  };

  const handleSaveNewspaper = async (settings: NewspaperSettings, feedUrls: string[]) => {
    if (!newspaper) return;

    try {
      setIsSaving(true);

      // Get data from sessionStorage for newly generated newspapers
      const languagesJson = sessionStorage.getItem('newspaperLanguages');
      const summary = sessionStorage.getItem('newspaperSummary');

      const languages = languagesJson ? JSON.parse(languagesJson) : newspaper.languages || [];

      const result = await saveNewspaper(
        settings,
        feedUrls, // Use modified feed URLs from modal
        newspaper.articles,
        locale,
        languages,
        summary || undefined
      );

      // Clear sessionStorage after successful save
      sessionStorage.removeItem('newspaperArticles');
      sessionStorage.removeItem('newspaperTheme');
      sessionStorage.removeItem('newspaperName');
      sessionStorage.removeItem('newspaperFeeds');
      sessionStorage.removeItem('newspaperFeedMetadata');
      sessionStorage.removeItem('newspaperLocale');
      sessionStorage.removeItem('newspaperLanguages');
      sessionStorage.removeItem('newspaperSummary');

      setIsSaved(true);

      // Navigate to the saved newspaper page
      router.push(`/newspaper?id=${result.newspaperId}`);
    } catch (err) {
      console.error('Error saving newspaper:', err);
      alert(t.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex gap-2 justify-center mb-4">
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '450ms' }}></div>
          </div>
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t.error}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

  if (!newspaper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">{t.newspaperNotFound}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t.backToHome}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f1e8]">
      {/* Header */}
      <header className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-center items-center relative gap-4 sm:gap-0">
            <div className="border-l-4 border-r-4 border-black px-4 py-2">
              <h1 className="text-2xl sm:text-4xl font-serif font-black text-black tracking-tight text-center">
                {t.appName}
              </h1>
              <p className="text-gray-800 text-xs font-serif italic mt-1 text-center">
                {t.appTagline}
              </p>
            </div>
            <div className="sm:absolute sm:right-0 flex gap-2">
              {/* Save Button - only show for unsaved newspapers (temp ID) */}
              {newspaper.newspaperId.startsWith('temp-') && !isSaved && (
                <button
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className="px-4 py-2 min-h-[44px] text-sm font-serif font-bold border-2 border-black bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? t.saving : t.save}
                </button>
              )}
              
              {/* Back to Home Button */}
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 min-h-[44px] text-sm font-serif font-bold border-2 border-black bg-black text-white hover:bg-gray-800 transition-colors"
              >
                {t.backToHome}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Date Navigation - show for saved newspapers (not temp-*) */}
      {!newspaper.newspaperId.startsWith('temp-') && date && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <DateNavigation
              currentDate={date}
              onDateChange={handleDateChange}
              locale={locale}
              isLoading={isDateChanging}
            />
          </div>
        </div>
      )}

      {/* Newspaper Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative">
        {/* Loading overlay for date changes */}
        {isDateChanging && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="flex gap-2 justify-center mb-4">
                <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '450ms' }}></div>
              </div>
              <p className="text-gray-600">{t.loading}</p>
            </div>
          </div>
        )}
        
        <NewspaperLayout
          articles={newspaper.articles}
          newspaperName={newspaper.name}
          userName={newspaper.userName}
          createdAt={new Date(newspaper.newspaperDate)}
          locale={locale}
          summary={newspaper.summary}
        />
      </div>

      {/* Newspaper Settings Modal */}
      <NewspaperSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveNewspaper}
        locale={locale}
        defaultName={newspaper.theme || newspaper.name}
        initialFeeds={feedMetadata}
      />
    </div>
  );
}


export default function NewspaperPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex gap-2 justify-center mb-4">
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <div className="w-2 h-12 bg-gray-900 animate-pulse" style={{ animationDelay: '450ms' }}></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <NewspaperContent />
    </Suspense>
  );
}
