'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeInput } from '@/components/features/feed/ThemeInput';
import { PopularNewspapers } from '@/components/features/home/PopularNewspapers';
import { TopicMarquee } from '@/components/ui/TopicMarquee';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { Footer } from '@/components/ui/Footer';
import { detectLocale, useTranslations } from '@/lib/i18n';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import type { Locale } from '@/types';

export default function Home() {
  const router = useRouter();
  const { subscriptions } = useSubscriptions();
  
  // Get locale from localStorage (set by LayoutClient)
  const [locale, setLocale] = useState<Locale>(() => {
    // During SSR, return 'en' as default
    if (typeof window === 'undefined') return 'en';
    
    // On client, check localStorage
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    return savedLocale || detectLocale();
  });
  
  const t = useTranslations(locale);

  const [theme, setTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCheckedInitialNavigation, setHasCheckedInitialNavigation] = useState(false);

  // Initial navigation logic: redirect to first subscribed newspaper on app load only
  useEffect(() => {
    // Check if this is the initial app load using sessionStorage
    const hasNavigated = sessionStorage.getItem('hasInitialNavigated');
    
    if (hasNavigated || hasCheckedInitialNavigation) return;
    
    if (subscriptions.length > 0) {
      const firstNewspaperId = subscriptions[0].id;
      const today = new Date().toISOString().split('T')[0];
      console.log('[Home] Initial load: Redirecting to first subscribed newspaper:', firstNewspaperId);
      sessionStorage.setItem('hasInitialNavigated', 'true');
      router.push(`/newspaper?id=${firstNewspaperId}&date=${today}`);
    }
    
    setHasCheckedInitialNavigation(true);
  }, [subscriptions, router, hasCheckedInitialNavigation]);

  // Sync locale from localStorage (updated by LayoutClient)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedLocale = localStorage.getItem('locale') as Locale | null;
      if (savedLocale && savedLocale !== locale) {
        setLocale(savedLocale);
      }
    };

    // Listen for storage changes from other tabs/components
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on mount
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [locale]);

  const handleGenerateNewspaper = async (themeValue: string) => {
    setTheme(themeValue);
    setError(null);
    setIsGenerating(true);

    try {
      console.log('[Home] Starting one-click generation for theme:', themeValue);
      
      // Call combined generation endpoint
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/newspapers/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: themeValue,
          locale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate newspaper');
      }

      const data = await response.json();
      console.log('[Home] Generation successful, got', data.articles.length, 'articles');
      
      // Store data in sessionStorage for the newspaper page
      sessionStorage.setItem('newspaperArticles', JSON.stringify(data.articles));
      sessionStorage.setItem('newspaperTheme', themeValue);
      sessionStorage.setItem('newspaperName', data.newspaperName || themeValue);
      sessionStorage.setItem('newspaperFeeds', JSON.stringify(data.feedUrls));
      sessionStorage.setItem('newspaperFeedMetadata', JSON.stringify(data.feedMetadata));
      sessionStorage.setItem('newspaperLocale', locale);
      sessionStorage.setItem('newspaperLanguages', JSON.stringify(data.languages || []));
      if (data.summary) {
        sessionStorage.setItem('newspaperSummary', data.summary);
      }
      if (data.editorialColumn) {
        sessionStorage.setItem('newspaperEditorialColumn', data.editorialColumn);
      }
      
      // Navigate to newspaper page
      router.push('/newspaper');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.generationFailed;
      setError(errorMessage);
      console.error('[Home] Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    // Set theme and automatically trigger generation
    setTheme(keyword);
    handleGenerateNewspaper(keyword);
  };

  const handleNewspaperClick = (newspaperId: string) => {
    router.push(`/newspaper?id=${newspaperId}`);
  };

  return (
    <main className="min-h-screen bg-[#f4f1e8]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Theme Input & Generation */}
          <div className="space-y-6">
            {/* Theme Input */}
            <div className="bg-white border-4 border-black shadow-lg p-4 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-serif font-black mb-4 sm:mb-6 border-b-2 border-black pb-2">{t.themeInputLabel}</h2>
              
              {/* Topic Marquee */}
              <div className="mb-4 sm:mb-6 -mx-4 sm:-mx-8">
                <TopicMarquee
                  keywords={t.topicKeywords}
                  onKeywordClick={handleKeywordClick}
                />
              </div>
              
              <ThemeInput
                onSubmit={handleGenerateNewspaper}
                isLoading={isGenerating}
                locale={locale}
                initialTheme={theme}
                buttonText={t.generateButton}
              />

              {/* Loading Animation */}
              {isGenerating && (
                <LoadingAnimation 
                  message={t.generatingNewspaper} 
                  type="newspaper"
                  helperText={t.pleaseWait}
                />
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-white border-4 border-red-800 p-4 sm:p-6">
                <p className="text-red-900 font-serif font-bold text-sm sm:text-base">{error}</p>
              </div>
            )}
          </div>

          {/* Popular Newspapers */}
          <div className="bg-white border-4 border-black shadow-lg p-4 sm:p-8">
            <PopularNewspapers
              locale={locale}
              onNewspaperClick={handleNewspaperClick}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer locale={locale} />
    </main>
  );
}
