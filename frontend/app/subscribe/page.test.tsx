import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import SubscribePage from './page';
import { subscriptionStorage } from '@/lib/subscriptionStorage';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock API fetch
global.fetch = vi.fn();

describe('SubscribePage', () => {
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

    subscriptionStorage.clearAll();
    vi.clearAllMocks();
  });

  describe('Unit Tests', () => {
    it('should display empty state when no subscriptions', async () => {
      render(<SubscribePage />);

      await waitFor(() => {
        expect(screen.getByText(/No subscribed newspapers yet/i)).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      subscriptionStorage.addSubscription('newspaper-1');
      
      (global.fetch as any).mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(<SubscribePage />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle missing newspapers (404)', async () => {
      subscriptionStorage.addSubscription('missing-newspaper');

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      render(<SubscribePage />);

      await waitFor(() => {
        expect(screen.getByText(/Missing Newspapers/i)).toBeInTheDocument();
      });
    });
  });

  describe('Property Tests', () => {
    // Feature: issue-84-newspaper-subscription, Property 19: Missing Newspaper Handling
    it('property: missing newspaper handling', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // Valid IDs only
              exists: fc.boolean(),
            }),
            { minLength: 1, maxLength: 5 } // Reduce max to avoid timeout
          ),
          async (newspapers) => {
            subscriptionStorage.clearAll();
            vi.clearAllMocks();

            // Add subscriptions
            newspapers.forEach(n => subscriptionStorage.addSubscription(n.id));

            // Mock fetch responses
            (global.fetch as any).mockImplementation((url: string) => {
              const id = url.split('/').pop();
              const newspaper = newspapers.find(n => n.id === id);
              
              if (!newspaper || !newspaper.exists) {
                return Promise.resolve({
                  ok: false,
                  status: 404,
                });
              }

              return Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                  id: newspaper.id,
                  title: `Newspaper ${newspaper.id}`,
                  createdAt: Date.now(),
                }),
              });
            });

            const { unmount } = render(<SubscribePage />);

            try {
              // Wait for loading to complete
              await waitFor(() => {
                const loadingSpinner = screen.queryByRole('progressbar');
                return loadingSpinner === null;
              }, { timeout: 5000 });

              const missingCount = newspapers.filter(n => !n.exists).length;

              if (missingCount > 0) {
                // Should display missing newspapers warning
                const warnings = screen.queryAllByText(/Missing Newspapers/i);
                return warnings.length > 0;
              } else {
                // Should not display warning
                const warnings = screen.queryAllByText(/Missing Newspapers/i);
                return warnings.length === 0;
              }
            } finally {
              unmount();
            }
          }
        ),
        { numRuns: 10 } // Reduce runs to avoid timeout
      );
    });
  });
});
