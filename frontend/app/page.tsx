'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeInput } from '@/components/features/feed/ThemeInput';
import { FeedSelector } from '@/components/features/feed/FeedSelector';
import { PopularNewspapers } from '@/components/features/home/PopularNewspapers';
import { Button } from '@/components/ui/Button';
import { detectLocale, useTranslations } from '@/lib/i18n';
import { suggestFeeds, generateNewspaper } from '@/lib/api';
import type { Locale } from '@/types';
import type { FeedSuggestion } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>('en');
  const t = useTranslations(locale);

  const [theme, setTheme] = useState('');
  const [suggestions, setSuggestions] = useState<FeedSuggestion[]>([]);
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect locale on mount
  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  const handleThemeSubmit = async (themeValue: string) => {
    setTheme(themeValue);
    setError(null);
    setIsLoadingSuggestions(true);

    try {
      const feedSuggestions = await suggestFeeds(themeValue);
      setSuggestions(feedSuggestions);
      
      // Auto-select all suggested feeds
      const feedUrls = feedSuggestions.map(s => s.url);
      setSelectedFeeds(feedUrls);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to suggest feeds');
    } finally {
      setIsLoadingSuggestions(false);
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
      const articles = await generateNewspaper(selectedFeeds, theme);
      
      // Store data in sessionStorage for the newspaper page
      sessionStorage.setItem('newspaperArticles', JSON.stringify(articles));
      sessionStorage.setItem('newspaperTheme', theme);
      sessionStorage.setItem('newspaperFeeds', JSON.stringify(selectedFeeds));
      
      // Navigate to newspaper page
      router.push('/newspaper');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate newspaper');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewspaperClick = (newspaperId: string) => {
    router.push(`/newspapers/${newspaperId}`);
  };

  const handleDemo = async () => {
    // Demo with pre-configured feeds
    const demoTheme = t.demoTheme;
    const demoFeeds = [
      'https://example.com/tech-feed',
      'https://example.com/community-feed',
    ];

    setTheme(demoTheme);
    setSelectedFeeds(demoFeeds);
    setSuggestions(demoFeeds.map(url => ({
      url,
      title: new URL(url).hostname.replace('www.', ''),
      reasoning: 'Demo feed',
    })));

    // Generate newspaper immediately
    setError(null);
    setIsGenerating(true);

    try {
      const articles = await generateNewspaper(demoFeeds, demoTheme);
      
      sessionStorage.setItem('newspaperArticles', JSON.stringify(articles));
      sessionStorage.setItem('newspaperTheme', demoTheme);
      sessionStorage.setItem('newspaperFeeds', JSON.stringify(demoFeeds));
      
      router.push('/newspaper');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate newspaper');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-center text-gray-900">
            {t.appName}
          </h1>
          <p className="text-center text-gray-600 mt-2">
            {t.appTagline}
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Theme Input & Feed Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Theme Input */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">{t.themeInputLabel}</h2>
              <ThemeInput
                onSubmit={handleThemeSubmit}
                isLoading={isLoadingSuggestions}
                locale={locale}
              />
              
              {/* Demo Button */}
              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDemo}
                  disabled={isGenerating}
                >
                  {t.demoButton}
                </Button>
              </div>
            </div>

            {/* Feed Selection */}
            {suggestions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <FeedSelector
                  suggestions={suggestions}
                  selectedFeeds={selectedFeeds}
                  onSelectionChange={setSelectedFeeds}
                  onGenerate={handleGenerateNewspaper}
                  isGenerating={isGenerating}
                  locale={locale}
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-center">{t.generating}</p>
              </div>
            )}
          </div>

          {/* Right Column: Popular Newspapers */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <PopularNewspapers
                locale={locale}
                onNewspaperClick={handleNewspaperClick}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
