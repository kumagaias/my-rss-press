'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeInput } from '@/components/features/feed/ThemeInput';
import { PopularNewspapers } from '@/components/features/home/PopularNewspapers';
import { TopicMarquee } from '@/components/ui/TopicMarquee';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { detectLocale, useTranslations } from '@/lib/i18n';
import type { Locale } from '@/types';

export default function Home() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('en');
  const t = useTranslations(locale);

  const [theme, setTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect locale on mount
  useEffect(() => {
    // Check localStorage first, then detect from browser
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    const detectedLocale = savedLocale || detectLocale();
    console.log('[Home] Detected locale:', detectedLocale);
    setLocale(detectedLocale);
  }, []);

  // Save locale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('locale', locale);
    console.log('[Home] Locale changed to:', locale);
    console.log('[Home] Topic keywords:', t.topicKeywords.slice(0, 5), '... (total:', t.topicKeywords.length, ')');
  }, [locale, t.topicKeywords]);

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
              <button
                onClick={() => setLocale('ja')}
                className={`px-4 py-2 min-h-[44px] text-sm font-serif font-bold border-2 border-black transition-colors ${
                  locale === 'ja'
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                日本語
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`px-4 py-2 min-h-[44px] text-sm font-serif font-bold border-2 border-black transition-colors ${
                  locale === 'en'
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

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
      <footer className="bg-black text-white border-t-4 border-black mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 text-xs font-serif">
            <p>© 2025 MyRSSPress</p>
            <p className="text-center">{t.footerTagline}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
