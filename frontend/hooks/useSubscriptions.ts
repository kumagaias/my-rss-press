import { useState, useEffect, useCallback } from 'react';
import { subscriptionStorage } from '@/lib/subscriptionStorage';
import type { SubscriptionItem } from '@/types';

export interface UseSubscriptionsReturn {
  subscriptions: SubscriptionItem[];
  isSubscribed: (newspaperId: string) => boolean;
  addSubscription: (newspaperId: string, title?: string) => boolean;
  removeSubscription: (newspaperId: string) => void;
  toggleSubscription: (newspaperId: string, title?: string) => void;
  reorderSubscriptions: (orderedSubscriptions: SubscriptionItem[]) => void;
  count: number;
  isAtLimit: boolean;
  isLoading: boolean;
}

/**
 * Announce a message to screen readers using ARIA live region
 * @param message - Message to announce
 */
function announceToScreenReader(message: string) {
  // Check if running in browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement with proper cleanup
  const timeoutId = setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
  
  // Store timeout ID for potential cleanup
  announcement.dataset.timeoutId = String(timeoutId);
}

/**
 * Custom hook for managing newspaper subscriptions
 * Provides React state management and cross-tab synchronization
 */
export function useSubscriptions(): UseSubscriptionsReturn {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load subscriptions on mount
  useEffect(() => {
    const loadSubscriptions = () => {
      try {
        const subs = subscriptionStorage.getSubscriptions();
        setSubscriptions(subs);
      } catch (error) {
        console.error('[useSubscriptions] Error loading subscriptions:', error);
        setSubscriptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, []);

  // Listen for storage events (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'myrsspress_subscriptions') {
        console.log('[useSubscriptions] Storage changed in another tab, reloading...');
        try {
          const subs = subscriptionStorage.getSubscriptions();
          setSubscriptions(subs);
          
          // Notify user about cross-tab update
          if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('subscription-updated', {
              detail: { source: 'cross-tab' }
            }));
          }
        } catch (error) {
          console.error('[useSubscriptions] Error reloading subscriptions:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check if a newspaper is subscribed
  const isSubscribed = useCallback(
    (newspaperId: string): boolean => {
      return subscriptions.some((s) => s.id === newspaperId);
    },
    [subscriptions]
  );

  // Add a subscription
  const addSubscription = useCallback(
    (newspaperId: string, title?: string): boolean => {
      const success = subscriptionStorage.addSubscription(newspaperId, title);
      if (success) {
        const subs = subscriptionStorage.getSubscriptions();
        setSubscriptions(subs);
        
        // Announce to screen readers
        if (typeof window !== 'undefined') {
          const announcement = title ? `Subscribed to ${title}` : 'Subscription added';
          announceToScreenReader(announcement);
        }
      }
      return success;
    },
    []
  );

  // Remove a subscription
  const removeSubscription = useCallback((newspaperId: string): void => {
    const sub = subscriptions.find(s => s.id === newspaperId);
    subscriptionStorage.removeSubscription(newspaperId);
    const subs = subscriptionStorage.getSubscriptions();
    setSubscriptions(subs);
    
    // Announce to screen readers
    if (typeof window !== 'undefined' && sub) {
      const announcement = sub.title ? `Unsubscribed from ${sub.title}` : 'Subscription removed';
      announceToScreenReader(announcement);
    }
  }, [subscriptions]);

  // Toggle subscription status
  const toggleSubscription = useCallback(
    (newspaperId: string, title?: string): void => {
      if (isSubscribed(newspaperId)) {
        removeSubscription(newspaperId);
      } else {
        addSubscription(newspaperId, title);
      }
    },
    [isSubscribed, addSubscription, removeSubscription]
  );

  // Reorder subscriptions
  const reorderSubscriptions = useCallback((orderedSubscriptions: SubscriptionItem[]): void => {
    const orderedIds = orderedSubscriptions.map(s => s.id);
    subscriptionStorage.reorderSubscriptions(orderedIds);
    const subs = subscriptionStorage.getSubscriptions();
    setSubscriptions(subs);
  }, []);

  // Get subscription count
  const count = subscriptions.length;

  // Check if at limit
  const isAtLimit = count >= 50;

  return {
    subscriptions,
    isSubscribed,
    addSubscription,
    removeSubscription,
    toggleSubscription,
    reorderSubscriptions,
    count,
    isAtLimit,
    isLoading,
  };
}
