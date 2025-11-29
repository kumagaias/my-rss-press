'use client';

import { useState } from 'react';
import { FeedSuggestion } from '@/types';
import { Locale, useTranslations } from '@/lib/i18n';

interface FeedSelectorProps {
  suggestions: FeedSuggestion[];
  onSelectionChange: (selected: string[]) => void;
  onGenerate: (selectedUrls: string[]) => void;
  locale: Locale;
}

export default function FeedSelector({ suggestions, onSelectionChange, onGenerate, locale }: FeedSelectorProps) {
  const [selectedFeeds, setSelectedFeeds] = useState<Set<string>>(new Set());
  const t = useTranslations(locale);

  const toggleFeed = (url: string) => {
    const newSelected = new Set(selectedFeeds);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedFeeds(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  const handleGenerate = () => {
    onGenerate(Array.from(selectedFeeds));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          {t.selectFeedsTitle}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {t.selectFeedsSubtitle}
        </p>

        <div className="space-y-4 mb-8">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.url}
              className={`p-6 bg-white rounded-lg shadow-md cursor-pointer transition-all ${
                selectedFeeds.has(suggestion.url)
                  ? 'ring-2 ring-orange-500 bg-orange-50'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => toggleFeed(suggestion.url)}
            >
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedFeeds.has(suggestion.url)}
                  onChange={() => {}}
                  className="mt-1 mr-4 h-5 w-5 text-orange-600 rounded focus:ring-orange-500"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {suggestion.title}
                  </h3>
                  <p className="text-gray-600 mb-2">{suggestion.reasoning}</p>
                  <p className="text-sm text-gray-400 truncate">{suggestion.url}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={selectedFeeds.size === 0}
          className="w-full py-4 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {t.generateButton} ({selectedFeeds.size}{locale === 'ja' ? t.feedsSelected : ` ${t.feedsSelected}`})
        </button>
      </div>
    </div>
  );
}
