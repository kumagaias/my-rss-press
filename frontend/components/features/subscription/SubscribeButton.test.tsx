import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { SubscribeButton } from './SubscribeButton';
import { subscriptionStorage } from '@/lib/subscriptionStorage';

describe('SubscribeButton', () => {
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
    it('should render icon-only variant with outlined heart when not subscribed', async () => {
      render(<SubscribeButton newspaperId="test-1" variant="icon-only" locale="en" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('aria-label', 'Subscribe');
      });
    });

    it('should render icon-only variant with filled heart when subscribed', async () => {
      subscriptionStorage.addSubscription('test-1');

      render(<SubscribeButton newspaperId="test-1" variant="icon-only" locale="en" />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Subscribed');
      });
    });

    it('should render full variant with text when not subscribed', async () => {
      render(<SubscribeButton newspaperId="test-1" variant="full" locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Subscribe')).toBeInTheDocument();
      });
    });

    it('should render full variant with text when subscribed', async () => {
      subscriptionStorage.addSubscription('test-1');

      render(<SubscribeButton newspaperId="test-1" variant="full" locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Subscribed')).toBeInTheDocument();
      });
    });

    it('should toggle subscription on click', async () => {
      render(<SubscribeButton newspaperId="test-1" variant="full" locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Subscribe')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Subscribed')).toBeInTheDocument();
      });

      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Subscribe')).toBeInTheDocument();
      });
    });

    it('should not render button when trying to subscribe at limit', async () => {
      // Add 50 subscriptions
      for (let i = 0; i < 50; i++) {
        subscriptionStorage.addSubscription(`newspaper-${i}`);
      }

      render(<SubscribeButton newspaperId="test-new" variant="full" locale="en" />);

      await waitFor(() => {
        // Button should not be rendered when at limit and not subscribed
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
      });
    });

    it('should stop propagation on click', async () => {
      const parentClickHandler = vi.fn();

      render(
        <div onClick={parentClickHandler}>
          <SubscribeButton newspaperId="test-1" variant="full" locale="en" />
        </div>
      );

      await waitFor(() => {
        expect(screen.getByText('Subscribe')).toBeInTheDocument();
      });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Parent handler should not be called
      expect(parentClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('Property Tests', () => {
    // Feature: issue-84-newspaper-subscription, Property 7: Visual State Consistency
    it('property: visual state matches subscription state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (id) => {
            subscriptionStorage.clearAll();

            // Test both subscribed and unsubscribed states
            const states = [false, true];

            for (const shouldBeSubscribed of states) {
              if (shouldBeSubscribed) {
                subscriptionStorage.addSubscription(id);
              }

              const { unmount } = render(<SubscribeButton newspaperId={id} variant="full" locale="en" />);

              await waitFor(() => {
                const expectedText = shouldBeSubscribed ? 'Subscribed' : 'Subscribe';
                expect(screen.getByText(expectedText)).toBeInTheDocument();
              });

              unmount();
              subscriptionStorage.clearAll();
            }

          return true;
        }),
        { numRuns: 50 }
      );
    });

    // Feature: issue-84-newspaper-subscription, Property 6: LocalStorage Synchronization
    it('property: localStorage updated immediately after click', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          async (id) => {
            subscriptionStorage.clearAll();

            const { unmount } = render(<SubscribeButton newspaperId={id} variant="full" locale="en" />);

            await waitFor(() => {
              expect(screen.getByText('Subscribe')).toBeInTheDocument();
            });

            const button = screen.getByRole('button');
            fireEvent.click(button);

            // Check localStorage immediately
            const isInStorage = subscriptionStorage.isSubscribed(id);

            unmount();
            subscriptionStorage.clearAll();

            return isInStorage === true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
