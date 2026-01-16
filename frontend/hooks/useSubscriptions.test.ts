import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { useSubscriptions } from './useSubscriptions';
import { subscriptionStorage } from '@/lib/subscriptionStorage';

describe('useSubscriptions', () => {
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: vi.fn(),
    } as any;

    // Clear subscriptions before each test
    subscriptionStorage.clearAll();
  });

  describe('Unit Tests', () => {
    it('should load subscriptions on mount', async () => {
      // Add some subscriptions
      subscriptionStorage.addSubscription('newspaper-1');
      subscriptionStorage.addSubscription('newspaper-2');

      const { result } = renderHook(() => useSubscriptions());

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.subscriptions).toHaveLength(2);
      expect(result.current.count).toBe(2);
    });

    it('should add a subscription', async () => {
      const { result } = renderHook(() => useSubscriptions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addSubscription('newspaper-1');
      });

      expect(result.current.isSubscribed('newspaper-1')).toBe(true);
      expect(result.current.count).toBe(1);
    });

    it('should remove a subscription', async () => {
      subscriptionStorage.addSubscription('newspaper-1');

      const { result } = renderHook(() => useSubscriptions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.removeSubscription('newspaper-1');
      });

      expect(result.current.isSubscribed('newspaper-1')).toBe(false);
      expect(result.current.count).toBe(0);
    });

    it('should toggle subscription', async () => {
      const { result } = renderHook(() => useSubscriptions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Toggle on
      act(() => {
        result.current.toggleSubscription('newspaper-1');
      });

      expect(result.current.isSubscribed('newspaper-1')).toBe(true);

      // Toggle off
      act(() => {
        result.current.toggleSubscription('newspaper-1');
      });

      expect(result.current.isSubscribed('newspaper-1')).toBe(false);
    });

    it('should reorder subscriptions', async () => {
      subscriptionStorage.addSubscription('newspaper-1');
      subscriptionStorage.addSubscription('newspaper-2');
      subscriptionStorage.addSubscription('newspaper-3');

      const { result } = renderHook(() => useSubscriptions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Get current subscriptions and reorder them
      const currentSubs = result.current.subscriptions;
      const reordered = [
        currentSubs.find(s => s.id === 'newspaper-3')!,
        currentSubs.find(s => s.id === 'newspaper-1')!,
        currentSubs.find(s => s.id === 'newspaper-2')!,
      ];

      act(() => {
        result.current.reorderSubscriptions(reordered);
      });

      expect(result.current.subscriptions[0].id).toBe('newspaper-3');
      expect(result.current.subscriptions[1].id).toBe('newspaper-1');
      expect(result.current.subscriptions[2].id).toBe('newspaper-2');
    });

    it('should detect when at limit', async () => {
      // Add 50 subscriptions
      for (let i = 0; i < 50; i++) {
        subscriptionStorage.addSubscription(`newspaper-${i}`);
      }

      const { result } = renderHook(() => useSubscriptions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAtLimit).toBe(true);
      expect(result.current.count).toBe(50);
    });

    it('should handle storage events (cross-tab sync)', async () => {
      const { result } = renderHook(() => useSubscriptions());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Simulate storage change in another tab
      subscriptionStorage.addSubscription('newspaper-from-other-tab');

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'myrsspress_subscriptions',
            newValue: localStorage.getItem('myrsspress_subscriptions'),
          })
        );
      });

      await waitFor(() => {
        expect(result.current.isSubscribed('newspaper-from-other-tab')).toBe(true);
      });
    });
  });

  describe('Property Tests', () => {
    // Feature: issue-84-newspaper-subscription, Property 5: Subscription Toggle Idempotence
    it('property: toggle idempotence', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 1, maxLength: 50 }), async (id) => {
          subscriptionStorage.clearAll();

          const { result } = renderHook(() => useSubscriptions());

          await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
          });

          const initialState = result.current.isSubscribed(id);

          // Toggle twice
          act(() => {
            result.current.toggleSubscription(id);
          });

          act(() => {
            result.current.toggleSubscription(id);
          });

          // Should return to initial state
          return result.current.isSubscribed(id) === initialState;
        }),
        { numRuns: 100 }
      );
    });

    // Feature: issue-84-newspaper-subscription, Property 16: Cross-Component State Synchronization
    it('property: cross-component synchronization', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            { minLength: 1, maxLength: 10 }
          ),
          async (ids) => {
            subscriptionStorage.clearAll();

            // Create two hook instances (simulating two components)
            const { result: result1 } = renderHook(() => useSubscriptions());
            const { result: result2 } = renderHook(() => useSubscriptions());

            await waitFor(() => {
              expect(result1.current.isLoading).toBe(false);
              expect(result2.current.isLoading).toBe(false);
            });

            // Add subscriptions in first hook
            for (const id of ids) {
              act(() => {
                result1.current.addSubscription(id);
              });
            }

            // Simulate storage event (cross-tab sync)
            act(() => {
              window.dispatchEvent(
                new StorageEvent('storage', {
                  key: 'myrsspress_subscriptions',
                  newValue: localStorage.getItem('myrsspress_subscriptions'),
                })
              );
            });

            // Wait for second hook to sync
            await waitFor(() => {
              expect(result2.current.count).toBe(ids.length);
            });

            // Both hooks should have the same subscriptions
            const ids1 = result1.current.subscriptions.map(s => s.id).sort();
            const ids2 = result2.current.subscriptions.map(s => s.id).sort();

            return JSON.stringify(ids1) === JSON.stringify(ids2);
          }
        ),
        { numRuns: 50 }
      );
    });

    // Feature: issue-84-newspaper-subscription, Property 17: Data Validation on Load
    it('property: data validation on load', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant('invalid json'),
            fc.constant('[]'),
            fc.constant('[{"id": ""}]'), // empty id
            fc.constant('[{"id": "test"}]'), // missing subscribedAt
            fc.constant('[{"subscribedAt": 123}]'), // missing id
            fc.constant('[{"id": "test", "subscribedAt": -1}]'), // invalid timestamp
          ),
          async (invalidData) => {
            subscriptionStorage.clearAll();
            
            // Set invalid data directly in localStorage
            localStorage.setItem('myrsspress_subscriptions', invalidData);

            const { result } = renderHook(() => useSubscriptions());

            await waitFor(() => {
              expect(result.current.isLoading).toBe(false);
            });

            // Should reset to empty array on invalid data
            return result.current.subscriptions.length === 0;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
