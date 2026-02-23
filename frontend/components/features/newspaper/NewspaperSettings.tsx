import { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import type { NewspaperSettings, Locale } from '@/types';
import { useTranslations, formatDate } from '@/lib/i18n';

interface FeedMetadata {
  url: string;
  title?: string;
  isDefault?: boolean;
}

interface NewspaperSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: NewspaperSettings, feedUrls: string[]) => void;
  locale: Locale;
  defaultName?: string;
  initialFeeds?: FeedMetadata[];
}

export function NewspaperSettingsModal({
  isOpen,
  onClose,
  onSave,
  locale,
  defaultName,
  initialFeeds = [],
}: NewspaperSettingsProps) {
  const t = useTranslations(locale);
  const [newspaperName, setNewspaperName] = useState('');
  const [userName, setUserName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [feeds, setFeeds] = useState<FeedMetadata[]>(initialFeeds);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [feedError, setFeedError] = useState<string | null>(null);

  // Set default newspaper name when modal opens
  useEffect(() => {
    if (isOpen && defaultName && !newspaperName) {
      setNewspaperName(defaultName);
    }
  }, [isOpen, defaultName, newspaperName]);

  // Update feeds when initialFeeds changes
  useEffect(() => {
    if (isOpen && initialFeeds.length > 0) {
      setFeeds(initialFeeds);
    }
  }, [isOpen, initialFeeds]);

  // Generate default newspaper name based on current date
  useEffect(() => {
    if (isOpen && !newspaperName && !defaultName) {
      const now = new Date();
      const dateStr = formatDate(now, locale);
      const defaultNewspaperName = t.defaultNewspaperName(dateStr);
      setNewspaperName(defaultNewspaperName);
    }
  }, [isOpen, locale, t, newspaperName, defaultName]);

  const handleSave = () => {
    const settings: NewspaperSettings = {
      newspaperName: newspaperName.trim() || getDefaultName(),
      userName: userName.trim() || 'Anonymous',
      isPublic,
    };
    
    // All feeds in the list are user-selected (no default feeds from backend)
    const feedUrls = feeds.map(f => f.url);
    
    console.log('[NewspaperSettings] Saving with feeds:', feedUrls);
    
    // Ensure at least one feed exists
    if (feedUrls.length === 0) {
      setFeedError(t.feedRequired || 'At least one feed is required');
      return;
    }
    
    onSave(settings, feedUrls);
    handleClose();
  };

  const handleClose = () => {
    // Reset form
    setNewspaperName('');
    setUserName('');
    setIsPublic(true);
    setFeeds(initialFeeds);
    setNewFeedUrl('');
    setFeedError(null);
    onClose();
  };

  const handleAddFeed = () => {
    const url = newFeedUrl.trim();
    
    // Validate URL
    try {
      const parsedUrl = new URL(url);
      // Only allow http and https protocols for security
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        setFeedError(t.invalidUrl);
        return;
      }
    } catch {
      setFeedError(t.invalidUrl);
      return;
    }
    
    // Check for duplicates
    if (feeds.some(f => f.url === url)) {
      setFeedError(t.duplicateFeed);
      return;
    }
    
    // Add feed with isDefault property
    setFeeds([...feeds, { url, title: url.split('/')[2] || url, isDefault: false }]);
    setNewFeedUrl('');
    setFeedError(null);
  };

  const handleRemoveFeed = (url: string) => {
    setFeeds(feeds.filter(f => f.url !== url));
  };

  const getDefaultName = (): string => {
    if (defaultName) return defaultName;
    const now = new Date();
    const dateStr = formatDate(now, locale);
    return t.defaultNewspaperName(dateStr);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t.newspaperSettings}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.newspaperName}
          </label>
          <Input
            type="text"
            value={newspaperName}
            onChange={(e) => setNewspaperName(e.target.value)}
            placeholder={getDefaultName()}
          />
          <p className="mt-1 text-xs text-gray-500">
            {t.defaultNameNote}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.userName}
          </label>
          <Input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t.userNamePlaceholder}
          />
          <p className="mt-1 text-xs text-gray-500">
            {t.anonymousNote}
          </p>
        </div>

        {/* Feed List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.feedsUsed}
          </label>
          <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
            {feeds.length === 0 ? (
              <p className="text-sm text-gray-500 p-3 text-center">
                {t.feedRequired}
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {feeds.map((feed) => (
                  <li key={feed.url} className="p-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {feed.title || feed.url}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFeed(feed.url)}
                      className="ml-2 text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      {t.removeButton}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Add Feed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.addFeedManually}
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              value={newFeedUrl}
              onChange={(e) => {
                setNewFeedUrl(e.target.value);
                setFeedError(null);
              }}
              placeholder={t.feedUrlPlaceholder}
              error={feedError || undefined}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="md"
              onClick={handleAddFeed}
              disabled={!newFeedUrl.trim()}
            >
              {t.addButton}
            </Button>
          </div>
        </div>

        {/* TODO: Phase 2 - Add public/private toggle */}
        {/* <div>
          <Checkbox
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            label={t.makePublic}
          />
          <p className="mt-1 text-xs text-gray-500 ml-6">
            {t.publicNote}
          </p>
        </div> */}
      </div>

      {/* Sticky Footer with Buttons */}
      <ModalFooter>
        <Button variant="outline" size="md" onClick={handleClose}>
          {t.cancel}
        </Button>
        <button
          onClick={handleSave}
          disabled={feeds.length === 0}
          className="px-6 py-3 text-base font-serif font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed border-2 border-blue-600 hover:border-blue-700 disabled:border-gray-400"
        >
          {t.save}
        </button>
      </ModalFooter>
    </Modal>
  );
}
