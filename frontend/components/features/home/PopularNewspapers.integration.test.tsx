import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PopularNewspapers } from './PopularNewspapers';
import { subscriptionStorage } from '@/lib/subscriptionStorage';

// Mock fetch
global.fetch = vi.fn();

describe('PopularNewspapers Integration', () => {
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

    // Clear subscriptions
    subscriptionStorage.clearAll();

    // Mock fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        newspapers: [
          {
            newspaperId: 'test-newspaper-1',
            name: 'Test Newspaper 1',
            userName: 'Test User',
            feedUrls: ['https://example.com/feed'],
            createdAt: '2026-01-16T00:00:00.000Z',
            updatedAt: '2026-01-16T00:00:00.000Z',
            viewCount: 100,
            isPublic: true,
            locale: 'en',
          },
          {
            newspaperId: 'test-newspaper-2',
            name: 'Test Newspaper 2',
            userName: 'Test User 2',
            feedUrls: ['https://example2.com/feed'],
            createdAt: '2026-01-16T00:00:00.000Z',
            updatedAt: '2026-01-16T00:00:00.000Z',
            viewCount: 50,
            isPublic: true,
            locale: 'en',
          },
        ],
      }),
    });
  });

  it('should display subscribe buttons on newspaper cards', async () => {
    render(<PopularNewspapers locale="en" />);

    // Wait for newspapers to load
    await waitFor(() => {
      expect(screen.getByText('Test Newspaper 1')).toBeInTheDocument();
    });

    // Check that subscribe buttons are present
    const buttons = screen.getAllByRole('button', { name: /subscribe/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should toggle subscription state across multiple cards', async () => {
    render(<PopularNewspapers locale="en" />);

    await waitFor(() => {
      expect(screen.getByText('Test Newspaper 1')).toBeInTheDocument();
    });

    // Get all subscribe buttons
    const buttons = screen.getAllByRole('button', { name: /subscribe/i });
    
    // Click first button to subscribe
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      // Check that the button state changed
      const subscribedButtons = screen.getAllByRole('button', { name: /subscribed/i });
      expect(subscribedButtons.length).toBeGreaterThan(0);
    });

    // Verify subscription in storage
    expect(subscriptionStorage.isSubscribed('test-newspaper-1')).toBe(true);
  });

  it('should maintain subscription state after re-render', async () => {
    // Subscribe to a newspaper
    subscriptionStorage.addSubscription('test-newspaper-1');

    const { rerender } = render(<PopularNewspapers locale="en" />);

    await waitFor(() => {
      expect(screen.getByText('Test Newspaper 1')).toBeInTheDocument();
    });

    // Check that button shows subscribed state
    await waitFor(() => {
      const subscribedButtons = screen.getAllByRole('button', { name: /subscribed/i });
      expect(subscribedButtons.length).toBeGreaterThan(0);
    });

    // Re-render component
    rerender(<PopularNewspapers locale="en" />);

    // State should persist
    await waitFor(() => {
      const subscribedButtons = screen.getAllByRole('button', { name: /subscribed/i });
      expect(subscribedButtons.length).toBeGreaterThan(0);
    });
  });
});
