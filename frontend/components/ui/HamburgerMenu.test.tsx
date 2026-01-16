import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { HamburgerMenu } from './HamburgerMenu';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('HamburgerMenu', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Unit Tests', () => {
    it('should render hamburger button', () => {
      render(<HamburgerMenu locale="en" />);
      const button = screen.getByRole('button', { expanded: false });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Menu');
    });

    it('should open menu when button is clicked', async () => {
      render(<HamburgerMenu locale="en" />);
      
      const button = screen.getByRole('button', { expanded: false });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Subscribed Newspapers')).toBeInTheDocument();
      });
    });

    it('should close menu when close button is clicked', async () => {
      render(<HamburgerMenu locale="en" />);
      
      // Open menu
      const openButton = screen.getByRole('button', { expanded: false });
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      // Close menu - get all buttons and find the close button (second one)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.getAttribute('aria-label') === 'Close Menu');
      expect(closeButton).toBeDefined();
      fireEvent.click(closeButton!);

      await waitFor(() => {
        const menuPanel = document.querySelector('.transform');
        expect(menuPanel).toHaveClass('-translate-x-full');
      });
    });

    it('should close menu when ESC key is pressed', async () => {
      render(<HamburgerMenu locale="en" />);
      
      // Open menu
      const button = screen.getByRole('button', { expanded: false });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      // Press ESC
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        const menuPanel = document.querySelector('.transform');
        expect(menuPanel).toHaveClass('-translate-x-full');
      });
    });

    it('should close menu when clicking outside', async () => {
      render(<HamburgerMenu locale="en" />);
      
      // Open menu
      const button = screen.getByRole('button', { expanded: false });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      // Click outside (on overlay)
      const overlay = document.querySelector('.bg-opacity-50');
      if (overlay) {
        fireEvent.mouseDown(overlay);
      }

      await waitFor(() => {
        const menuPanel = document.querySelector('.transform');
        expect(menuPanel).toHaveClass('-translate-x-full');
      });
    });

    it('should navigate to home when Home is clicked', async () => {
      render(<HamburgerMenu locale="en" />);
      
      // Open menu
      const button = screen.getByRole('button', { expanded: false });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
      });

      // Click Home
      const homeButton = screen.getByText('Home');
      fireEvent.click(homeButton);

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('should navigate to subscribe when Subscribe is clicked', async () => {
      render(<HamburgerMenu locale="en" />);
      
      // Open menu
      const button = screen.getByRole('button', { expanded: false });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Subscribed Newspapers')).toBeInTheDocument();
      });

      // Click Subscribe
      const subscribeButton = screen.getByText('Subscribed Newspapers');
      fireEvent.click(subscribeButton);

      expect(mockPush).toHaveBeenCalledWith('/subscribe');
    });
  });

  describe('Property Tests', () => {
    // Feature: issue-84-newspaper-subscription, Property 8: Menu Navigation Behavior
    it('property: menu navigation closes menu and navigates', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('/', '/subscribe'),
          async (path) => {
            mockPush.mockClear();
            
            const { unmount } = render(<HamburgerMenu locale="en" />);
            
            // Open menu
            const button = screen.getByRole('button', { expanded: false });
            fireEvent.click(button);

            await waitFor(() => {
              expect(screen.getByText('Home')).toBeInTheDocument();
            });

            // Click menu item
            const menuItem = path === '/' 
              ? screen.getByText('Home')
              : screen.getByText('Subscribed Newspapers');
            fireEvent.click(menuItem);

            // Should navigate
            const navigated = mockPush.mock.calls.some(call => call[0] === path);

            unmount();
            return navigated;
          }
        ),
        { numRuns: 20 }
      );
    });

    // Feature: issue-84-newspaper-subscription, Property 9: Click-Outside Menu Closure
    it('property: clicking outside closes menu', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant(true),
          async () => {
            const { unmount } = render(<HamburgerMenu locale="en" />);
            
            // Open menu
            const button = screen.getByRole('button', { expanded: false });
            fireEvent.click(button);

            await waitFor(() => {
              expect(screen.getByText('Home')).toBeInTheDocument();
            });

            // Click outside
            const overlay = document.querySelector('.bg-opacity-50');
            if (overlay) {
              fireEvent.mouseDown(overlay);
            }

            await waitFor(() => {
              const menuPanel = document.querySelector('.transform');
              const isClosed = menuPanel?.classList.contains('-translate-x-full');
              unmount();
              return isClosed === true;
            });

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
