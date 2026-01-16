import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { SubscriptionStorageService } from './subscriptionStorage';

describe('SubscriptionStorageService', () => {
  let service: SubscriptionStorageService;
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

    service = new SubscriptionStorageService();
  });

  describe('Property Tests', () => {
    // Feature: issue-84-newspaper-subscription, Property 1: Subscription Persistence
    it('property: subscription round trip', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            { minLength: 1, maxLength: 50 }
          ),
          (ids) => {
            service.clearAll();

            // Subscribe to all IDs
            ids.forEach((id) => service.addSubscription(id));

            // Retrieve subscriptions
            const retrieved = service.getSubscriptions().map((s) => s.id);

            // Should contain all subscribed IDs
            return ids.every((id) => retrieved.includes(id));
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: issue-84-newspaper-subscription, Property 2: Unsubscription Removal
    it('property: unsubscription removes ID', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          (id) => {
            service.clearAll();
            service.addSubscription(id);
            service.removeSubscription(id);
            return !service.isSubscribed(id);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: issue-84-newspaper-subscription, Property 3: Order Persistence
    it('property: order preservation', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            { minLength: 2, maxLength: 10 }
          ),
          (ids) => {
            service.clearAll();

            // Add subscriptions
            ids.forEach((id) => service.addSubscription(id));

            // Reorder
            const shuffled = [...ids].sort(() => Math.random() - 0.5);
            service.reorderSubscriptions(shuffled);

            // Verify order
            const retrieved = service.getSubscriptions().map((s) => s.id);
            return JSON.stringify(retrieved) === JSON.stringify(shuffled);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: issue-84-newspaper-subscription, Property 4: JSON Schema Validation
    it('property: JSON schema validation', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            { minLength: 1, maxLength: 10 }
          ),
          (ids) => {
            service.clearAll();

            // Add subscriptions
            ids.forEach((id) => service.addSubscription(id));

            // Get raw data from localStorage
            const rawData = localStorage.getItem('myrsspress_subscriptions');
            if (!rawData) return false;

            const parsed = JSON.parse(rawData);

            // Validate schema
            const hasSubscriptionsArray = Array.isArray(parsed.subscriptions);
            const allItemsValid = parsed.subscriptions.every(
              (item: any) =>
                typeof item.id === 'string' &&
                typeof item.order === 'number' &&
                typeof item.subscribedAt === 'string'
            );

            return hasSubscriptionsArray && allItemsValid;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: issue-84-newspaper-subscription, Property 20: Subscription Limit Enforcement
    it('property: subscription limit enforcement', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            { minLength: 51, maxLength: 100 }
          ),
          (ids) => {
            service.clearAll();

            // Remove duplicates to ensure we have unique IDs
            const uniqueIds = Array.from(new Set(ids));
            
            // If we don't have enough unique IDs, skip this test case
            if (uniqueIds.length < 51) {
              return true;
            }

            // Try to add more than 50
            const results = uniqueIds.map((id) => service.addSubscription(id));

            // First 50 should succeed, rest should fail
            const successCount = results.filter((r) => r === true).length;
            return successCount === 50 && service.getCount() === 50;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should add a subscription', () => {
      const result = service.addSubscription('newspaper-123');
      expect(result).toBe(true);
      expect(service.isSubscribed('newspaper-123')).toBe(true);
    });

    it('should remove a subscription', () => {
      service.addSubscription('newspaper-123');
      service.removeSubscription('newspaper-123');
      expect(service.isSubscribed('newspaper-123')).toBe(false);
    });

    it('should get all subscriptions', () => {
      service.addSubscription('newspaper-1');
      service.addSubscription('newspaper-2');
      const subscriptions = service.getSubscriptions();
      expect(subscriptions).toHaveLength(2);
      expect(subscriptions[0].id).toBe('newspaper-1');
      expect(subscriptions[1].id).toBe('newspaper-2');
    });

    it('should reorder subscriptions', () => {
      service.addSubscription('newspaper-1');
      service.addSubscription('newspaper-2');
      service.addSubscription('newspaper-3');

      service.reorderSubscriptions(['newspaper-3', 'newspaper-1', 'newspaper-2']);

      const subscriptions = service.getSubscriptions();
      expect(subscriptions[0].id).toBe('newspaper-3');
      expect(subscriptions[1].id).toBe('newspaper-1');
      expect(subscriptions[2].id).toBe('newspaper-2');
    });

    it('should enforce subscription limit', () => {
      // Add 50 subscriptions
      for (let i = 0; i < 50; i++) {
        service.addSubscription(`newspaper-${i}`);
      }

      // Try to add 51st
      const result = service.addSubscription('newspaper-51');
      expect(result).toBe(false);
      expect(service.getCount()).toBe(50);
    });

    it('should handle corrupted data', () => {
      // Set corrupted data
      localStorage.setItem('myrsspress_subscriptions', 'invalid json');

      // Should reset to empty
      const subscriptions = service.getSubscriptions();
      expect(subscriptions).toHaveLength(0);
    });

    it('should clear all subscriptions', () => {
      service.addSubscription('newspaper-1');
      service.addSubscription('newspaper-2');
      service.clearAll();
      expect(service.getCount()).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    // Feature: issue-84-newspaper-subscription, Property 18: Performance Constraint
    it('property: operations complete within 100ms', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            { minLength: 1, maxLength: 50 }
          ),
          (ids) => {
            service.clearAll();

            // Test addSubscription performance
            const addStart = performance.now();
            for (const id of ids) {
              service.addSubscription(id);
            }
            const addDuration = performance.now() - addStart;
            const avgAddTime = addDuration / ids.length;

            // Test getSubscriptions performance
            const getStart = performance.now();
            service.getSubscriptions();
            const getDuration = performance.now() - getStart;

            // Test reorderSubscriptions performance
            const reversed = [...ids].reverse();
            const reorderStart = performance.now();
            service.reorderSubscriptions(reversed);
            const reorderDuration = performance.now() - reorderStart;

            // Test removeSubscription performance
            const removeStart = performance.now();
            for (const id of ids) {
              service.removeSubscription(id);
            }
            const removeDuration = performance.now() - removeStart;
            const avgRemoveTime = removeDuration / ids.length;

            // Each operation should complete within 100ms
            return (
              avgAddTime < 100 &&
              getDuration < 100 &&
              reorderDuration < 100 &&
              avgRemoveTime < 100
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
