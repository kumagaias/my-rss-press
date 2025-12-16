'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeInput } from '@/components/features/feed/ThemeInput';
import { FeedSelector } from '@/components/features/feed/FeedSelector';
import { PopularNewspapers } from '@/components/features/home/PopularNewspapers';
import { TopicMarquee } from '@/components/ui/TopicMarquee';
import { LoadingAnimation } from '@/components/ui/LoadingAnimation';
import { SuccessAnimation } from '@/components/ui/SuccessAnimation';
import { detectLocale, useTranslations } from '@/lib/i18n';
import { suggestFeeds, generateNewspaper } from '@/lib/api';
import type { Locale, FeedSuggestion } from '@/types';

export default function Home() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('en');
  const t = useTranslations(locale);

  const [theme, setTheme] = useState('');
  const [suggestions, setSuggestions] = useState<FeedSuggestion[]>([]);
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect locale on mount
  useEffect(() => {
    // Check localStorage first, then detect from browser
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    setLocale(savedLocale || detectLocale());
  }, []);

  // Save locale to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('locale', locale);
  }, [locale]);

  const handleThemeSubmit = async (themeValue: string) => {
    setTheme(themeValue);
    setError(null);
    setShowSuccessAnimation(false);
    setIsLoadingSuggestions(true);

    try {
      const feedSuggestions = await suggestFeeds(themeValue, locale);
      setSuggestions(feedSuggestions);
      
      // Auto-select all suggested feeds
      const feedUrls = feedSuggestions.map(s => s.url);
      setSelectedFeeds(feedUrls);
      
      // Show success animation
      setShowSuccessAnimation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suggest feeds');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    // Set theme in input field and automatically trigger feed suggestions
    setTheme(keyword);
    handleThemeSubmit(keyword);
  };

  const handleScrollToGenerate = () => {
    // Scroll to the FeedSelector section
    const feedSelectorElement = document.getElementById('feed-selector');
    if (feedSelectorElement) {
      feedSelectorElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleGenerateNewspaper = async () => {
    if (selectedFeeds.length === 0) {
      setError(t.feedRequired);
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // Extract default feed URLs (feeds marked as default/fallback)
      const defaultFeedUrls = suggestions
        .filter(s => s.isDefault)
        .map(s => s.url);
      
      const { articles, languages, summary } = await generateNewspaper(selectedFeeds, theme, defaultFeedUrls, locale);
      
      // Store data in sessionStorage for the newspaper page
      sessionStorage.setItem('newspaperArticles', JSON.stringify(articles));
      sessionStorage.setItem('newspaperTheme', theme);
      sessionStorage.setItem('newspaperFeeds', JSON.stringify(selectedFeeds));
      sessionStorage.setItem('newspaperLocale', locale); // Save selected locale
      sessionStorage.setItem('newspaperLanguages', JSON.stringify(languages)); // Save detected languages
      if (summary) {
        sessionStorage.setItem('newspaperSummary', summary); // Save generated summary
      }
      
      // Navigate to newspaper page
      router.push('/newspaper');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate newspaper';
      setError(errorMessage);
      console.error('Newspaper generation error:', err);
      
      // Show user-friendly message for common errors
      if (errorMessage.includes('記事を取得できませんでした') || errorMessage.includes('記事数が不足')) {
        setError(
          locale === 'ja'
            ? 'フィードから記事を取得できませんでした。別のフィードを試すか、AI提案を使用してください。'
            : 'Failed to fetch articles from the feeds. Please try different feeds or use AI suggestions.'
        );
      }
    } finally {
      setIsGenerating(false);
    }
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
          {/* Theme Input & Feed Selection */}
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
                onSubmit={handleThemeSubmit}
                isLoading={isLoadingSuggestions}
                locale={locale}
                initialTheme={theme}
              />

              {/* Loading Animation */}
              {isLoadingSuggestions && <LoadingAnimation message={t.loadingSuggestions} type="feed" />}

              {/* Success Animation */}
              {showSuccessAnimation && !isLoadingSuggestions && suggestions.length > 0 && (
                <SuccessAnimation onScrollToGenerate={handleScrollToGenerate} locale={locale} />
              )}
            </div>

            {/* Feed Selection */}
            {suggestions.length > 0 && (
              <div id="feed-selector" className="bg-white border-4 border-black shadow-lg p-4 sm:p-8">
                <FeedSelector
                  suggestions={suggestions}
                  selectedFeeds={selectedFeeds}
                  onSelectionChange={setSelectedFeeds}
                  onGenerate={handleGenerateNewspaper}
                  isGenerating={isGenerating}
                  locale={locale}
                  generatingMessage={t.generating}
                />
              </div>
            )}

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
