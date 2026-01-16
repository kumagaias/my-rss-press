import type { SubscriptionItem, SubscriptionStorage } from '@/types';

/**
 * Service for managing newspaper subscriptions in localStorage
 * Handles CRUD operations, data validation, and error recovery
 */
export class SubscriptionStorageService {
  private readonly STORAGE_KEY = 'myrsspress_subscriptions';
  private readonly MAX_SUBSCRIPTIONS = 50;
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkLocalStorageAvailability();
  }

  /**
   * Check if localStorage is available
   * @returns true if localStorage is accessible, false otherwise
   */
  private checkLocalStorageAvailability(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.error('[SubscriptionStorage] localStorage is not available:', e);
      return false;
    }
  }

  /**
   * Get localStorage availability status
   * @returns true if localStorage is available
   */
  public isLocalStorageAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Validate subscription data structure
   * @param data - Data to validate
   * @returns true if data is valid
   */
  private validateSubscriptionData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.subscriptions)) return false;

    return data.subscriptions.every(
      (item: any) =>
        typeof item.id === 'string' &&
        typeof item.order === 'number' &&
        typeof item.subscribedAt === 'string'
    );
  }

  /**
   * Validate and repair corrupted data
   * @returns Valid subscription storage or empty storage
   */
  private validateAndRepair(): SubscriptionStorage {
    if (!this.isAvailable) {
      return { subscriptions: [] };
    }

    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) {
        return { subscriptions: [] };
      }

      const parsed = JSON.parse(data);
      if (this.validateSubscriptionData(parsed)) {
        return parsed;
      }

      // Data is corrupted, reset to empty
      console.warn('[SubscriptionStorage] Corrupted data detected, resetting to empty');
      const empty: SubscriptionStorage = { subscriptions: [] };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(empty));
      return empty;
    } catch (e) {
      console.error('[SubscriptionStorage] Error reading data:', e);
      const empty: SubscriptionStorage = { subscriptions: [] };
      if (this.isAvailable) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(empty));
      }
      return empty;
    }
  }

  /**
   * Save subscription data to localStorage
   * @param storage - Subscription storage to save
   */
  private save(storage: SubscriptionStorage): void {
    if (!this.isAvailable) {
      console.warn('[SubscriptionStorage] Cannot save, localStorage not available');
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storage));
    } catch (e) {
      console.error('[SubscriptionStorage] Error saving data:', e);
    }
  }

  /**
   * Get all subscriptions sorted by order
   * @returns Array of subscription items
   */
  public getSubscriptions(): SubscriptionItem[] {
    const storage = this.validateAndRepair();
    return storage.subscriptions.sort((a, b) => a.order - b.order);
  }

  /**
   * Add a subscription
   * @param newspaperId - ID of the newspaper to subscribe to
   * @param title - Optional title of the newspaper
   * @returns true if subscription was added, false if limit reached or already subscribed
   */
  public addSubscription(newspaperId: string, title?: string): boolean {
    const startTime = performance.now();
    
    if (!this.isAvailable) {
      console.warn('[SubscriptionStorage] Cannot add subscription, localStorage not available');
      return false;
    }

    const storage = this.validateAndRepair();

    // Check if already subscribed
    if (storage.subscriptions.some((s) => s.id === newspaperId)) {
      return true; // Already subscribed, consider it success
    }

    // Check limit
    if (storage.subscriptions.length >= this.MAX_SUBSCRIPTIONS) {
      console.warn('[SubscriptionStorage] Subscription limit reached');
      return false;
    }

    // Add new subscription
    const newSubscription: SubscriptionItem = {
      id: newspaperId,
      title,
      order: storage.subscriptions.length,
      subscribedAt: new Date().toISOString(),
    };

    storage.subscriptions.push(newSubscription);
    this.save(storage);
    
    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`[SubscriptionStorage] addSubscription took ${duration.toFixed(2)}ms (threshold: 100ms)`);
    }
    
    return true;
  }

  /**
   * Remove a subscription
   * @param newspaperId - ID of the newspaper to unsubscribe from
   */
  public removeSubscription(newspaperId: string): void {
    const startTime = performance.now();
    
    if (!this.isAvailable) {
      console.warn('[SubscriptionStorage] Cannot remove subscription, localStorage not available');
      return;
    }

    const storage = this.validateAndRepair();
    storage.subscriptions = storage.subscriptions.filter((s) => s.id !== newspaperId);

    // Reorder remaining subscriptions
    storage.subscriptions.forEach((s, index) => {
      s.order = index;
    });

    this.save(storage);
    
    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`[SubscriptionStorage] removeSubscription took ${duration.toFixed(2)}ms (threshold: 100ms)`);
    }
  }

  /**
   * Check if a newspaper is subscribed
   * @param newspaperId - ID of the newspaper to check
   * @returns true if subscribed
   */
  public isSubscribed(newspaperId: string): boolean {
    const storage = this.validateAndRepair();
    return storage.subscriptions.some((s) => s.id === newspaperId);
  }

  /**
   * Reorder subscriptions
   * @param orderedIds - Array of newspaper IDs in desired order
   */
  public reorderSubscriptions(orderedIds: string[]): void {
    const startTime = performance.now();
    
    if (!this.isAvailable) {
      console.warn('[SubscriptionStorage] Cannot reorder, localStorage not available');
      return;
    }

    const storage = this.validateAndRepair();
    const subscriptionMap = new Map(storage.subscriptions.map((s) => [s.id, s]));

    // Create new ordered array
    const reordered: SubscriptionItem[] = [];
    orderedIds.forEach((id, index) => {
      const subscription = subscriptionMap.get(id);
      if (subscription) {
        subscription.order = index;
        reordered.push(subscription);
      }
    });

    storage.subscriptions = reordered;
    this.save(storage);
    
    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`[SubscriptionStorage] reorderSubscriptions took ${duration.toFixed(2)}ms (threshold: 100ms)`);
    }
  }

  /**
   * Get subscription count
   * @returns Number of subscriptions
   */
  public getCount(): number {
    const storage = this.validateAndRepair();
    return storage.subscriptions.length;
  }

  /**
   * Clear all subscriptions
   */
  public clearAll(): void {
    if (!this.isAvailable) {
      console.warn('[SubscriptionStorage] Cannot clear, localStorage not available');
      return;
    }

    const empty: SubscriptionStorage = { subscriptions: [] };
    this.save(empty);
  }
}

// Export singleton instance
export const subscriptionStorage = new SubscriptionStorageService();
