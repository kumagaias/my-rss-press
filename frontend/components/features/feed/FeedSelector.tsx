'use client';

import { useState, useMemo } from 'react';
import { FeedSuggestion, Locale } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { useTranslations } from '@/lib/i18n';

interface FeedSelectorProps {
  suggestions: FeedSuggestion[];
  selectedFeeds: string[];
  onSelectionChange: (feeds: string[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  locale: Locale;
}

/**
 * FeedSelector Component
 * 
 * Displays AI-suggested feeds and allows users to:
 * - Select/deselect suggested feeds
 * - Add custom feed URLs manually
 * - Remove feeds from the list
 * - Generate newspaper from selected feeds
 */
export function FeedSelector({
  suggestions,
  selectedFeeds,
  onSelectionChange,
  onGenerate,
  isGenerating,
  locale,
}: FeedSelectorProps) {
  const [customFeedUrl, setCustomFeedUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a Map for O(1) lookup of suggestions by URL
   * This prevents O(n*m) complexity when rendering selected feeds
   */
  const suggestionMap = useMemo(
    () => new Map(suggestions.map((s) => [s.url, s])),
    [suggestions]
  );

  const t = useTranslations(locale);

  /**
   * Validate URL format
   */
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Check if feed already exists in selected feeds
   */
  const isDuplicate = (url: string): boolean => {
    return selectedFeeds.includes(url);
  };

  /**
   * Toggle feed selection
   */
  const toggleFeed = (url: string) => {
    if (selectedFeeds.includes(url)) {
      onSelectionChange(selectedFeeds.filter((f) => f !== url));
    } else {
      onSelectionChange([...selectedFeeds, url]);
    }
  };

  /**
   * Add custom feed URL
   */
  const handleAddCustomFeed = () => {
    const trimmedUrl = customFeedUrl.trim();

    if (!trimmedUrl) {
      return;
    }

    if (!isValidUrl(trimmedUrl)) {
      setError(t.errorInvalidUrl);
      return;
    }

    if (isDuplicate(trimmedUrl)) {
      setError(t.errorDuplicate);
      return;
    }

    onSelectionChange([...selectedFeeds, trimmedUrl]);
    setCustomFeedUrl('');
    setError(null);
  };

  /**
   * Remove feed from selection
   */
  const handleRemoveFeed = (url: string) => {
    onSelectionChange(selectedFeeds.filter((f) => f !== url));
  };

  /**
   * Handle generate button click
   */
  const handleGenerate = () => {
    if (selectedFeeds.length === 0) {
      setError(t.errorSelectFeed);
      return;
    }
    setError(null);
    onGenerate();
  };

  return (
    <div className="w-full space-y-6">
      {/* Suggested Feeds */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">{t.suggestedFeeds}</h3>
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.url}
                onClick={() => toggleFeed(suggestion.url)}
                className="p-4 border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedFeeds.includes(suggestion.url)}
                    onChange={() => {}} // Handled by parent div onClick
                    label=""
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.reasoning}</p>
                    <p className="text-xs text-gray-500 mt-1 break-all">{suggestion.url}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Feed Input */}
      <div>
        <h3 className="text-lg font-semibold mb-3">{t.addCustomFeed}</h3>
        <div className="flex space-x-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={t.feedUrlPlaceholder}
              value={customFeedUrl}
              onChange={(e) => {
                setCustomFeedUrl(e.target.value);
                if (error) setError(null);
              }}
              error={error || undefined}
              disabled={isGenerating}
            />
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={handleAddCustomFeed}
            disabled={isGenerating || !customFeedUrl.trim()}
          >
            {t.addButton}
          </Button>
        </div>
      </div>

      {/* Selected Feeds List */}
      {selectedFeeds.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            {t.selectedCount(selectedFeeds.length)}
          </h3>
          <div className="space-y-2">
            {selectedFeeds.map((url) => {
              const suggestion = suggestionMap.get(url);
              return (
                <div
                  key={url}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    {suggestion ? (
                      <p className="font-medium text-gray-900 truncate">{suggestion.title}</p>
                    ) : (
                      <p className="text-sm text-gray-700 truncate">{url}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFeed(url)}
                    disabled={isGenerating}
                  >
                    {t.removeButton}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="pt-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || selectedFeeds.length === 0}
          loading={isGenerating}
          className="w-full"
        >
          {t.generateButton}
        </Button>
      </div>
    </div>
  );
}
