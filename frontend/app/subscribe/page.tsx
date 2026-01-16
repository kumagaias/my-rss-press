'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { detectLocale, useTranslations } from '@/lib/i18n';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscribedNewspaperList } from '@/components/features/subscription/SubscribedNewspaperList';
import { Footer } from '@/components/ui/Footer';
import { getNewspaper } from '@/lib/api';
import type { NewspaperData, Locale } from '@/types';

export default function SubscribePage() {
  // Get locale from localStorage (set by LayoutClient)
  const [locale, setLocale] = useState<Locale>(() => {
    // During SSR, return 'en' as default
    if (typeof window === 'undefined') return 'en';
    
    // On client, check localStorage
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    return savedLocale || detectLocale();
  });
  
  const t = useTranslations(locale);
  const router = useRouter();
  const { subscriptions, removeSubscription } = useSubscriptions();
  const [newspapers, setNewspapers] = useState<NewspaperData[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingNewspaperIds, setMissingNewspaperIds] = useState<string[]>([]);

  // Sync locale from localStorage (updated by LayoutClient)
  useEffect(() => {
    // Check localStorage periodically for locale changes
    const checkLocale = () => {
      const savedLocale = localStorage.getItem('locale') as Locale | null;
      if (savedLocale && savedLocale !== locale) {
        console.log('[Subscribe] Locale changed to:', savedLocale);
        setLocale(savedLocale);
      }
    };

    // Check immediately on mount
    checkLocale();

    // Check every 500ms for locale changes
    const interval = setInterval(checkLocale, 500);

    return () => {
      clearInterval(interval);
    };
  }, [locale]);

  useEffect(() => {
    const fetchNewspapers = async () => {
      if (subscriptions.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          subscriptions.map(async (sub) => {
            try {
              const data = await getNewspaper(sub.id);
              return { id: sub.id, data, missing: false };
            } catch (error) {
              console.error(`Failed to fetch newspaper ${sub.id}:`, error);
              // If error message contains "404" or "not found", mark as missing
              const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
              if (errorMessage.includes('404') || errorMessage.includes('not found')) {
                return { id: sub.id, missing: true };
              }
              return null;
            }
          })
        );

        const validNewspapers: NewspaperData[] = [];
        const missing: string[] = [];

        results.forEach((result) => {
          if (result && result.missing) {
            missing.push(result.id);
          } else if (result && result.data) {
            validNewspapers.push(result.data);
          }
        });

        setNewspapers(validNewspapers);
        setMissingNewspaperIds(missing);
      } catch (error) {
        console.error('Failed to fetch newspapers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewspapers();
  }, [subscriptions]);

  const handleNewspaperClick = (id: string) => {
    router.push(`/newspaper?id=${id}`);
  };

  const handleRemoveMissing = (id: string) => {
    removeSubscription(id);
  };

  return (
    <div className="min-h-screen bg-[#f5f1e8] flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-serif font-black mb-2 border-b-4 border-black pb-2">
            {t.subscribedNewspapers}
          </h1>
          <p className="text-gray-600 mt-4">
            {subscriptions.length === 0
              ? t.noSubscriptions
              : t.subscriptionCount.replace('{count}', subscriptions.length.toString())}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" 
              role="progressbar"
              aria-label="Loading"
            />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 mb-6">{t.noSubscriptionsMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-black text-white font-serif font-bold hover:bg-gray-800 transition-colors"
            >
              {t.goToHome}
            </button>
          </div>
        ) : (
          <>
            {missingNewspaperIds.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-yellow-800 mb-2">
                      {t.missingNewspapersTitle}
                    </h3>
                    <p className="text-yellow-700 mb-3">
                      {t.missingNewspapersMessage}
                    </p>
                    <div className="space-y-2">
                      {missingNewspaperIds.map((id) => (
                        <div key={id} className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="text-sm text-gray-600 font-mono">{id}</span>
                          <button
                            onClick={() => handleRemoveMissing(id)}
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            {t.removeFromSubscriptions}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <SubscribedNewspaperList
              subscriptions={subscriptions}
              newspapers={newspapers}
              onNewspaperClick={handleNewspaperClick}
              locale={locale}
            />
          </>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
