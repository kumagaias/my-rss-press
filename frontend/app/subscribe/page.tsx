'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { detectLocale, useTranslations } from '@/lib/i18n';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SubscribedNewspaperList } from '@/components/features/subscription/SubscribedNewspaperList';
import { Footer } from '@/components/ui/Footer';
import type { NewspaperData } from '@/types';

export default function SubscribePage() {
  const locale = detectLocale();
  const t = useTranslations(locale);
  const router = useRouter();
  const { subscriptions, removeSubscription } = useSubscriptions();
  const [newspapers, setNewspapers] = useState<NewspaperData[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingNewspaperIds, setMissingNewspaperIds] = useState<string[]>([]);

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
              const response = await fetch(`/api/newspapers/${sub.id}`);
              if (!response.ok) {
                if (response.status === 404) {
                  return { id: sub.id, missing: true };
                }
                return null;
              }
              const data = await response.json();
              return { id: sub.id, data, missing: false };
            } catch (error) {
              console.error(`Failed to fetch newspaper ${sub.id}:`, error);
              return null;
            }
          })
        );

        const validNewspapers: Newspaper[] = [];
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
