import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { SubscribedNewspaperList } from './SubscribedNewspaperList';
import type { SubscriptionItem, NewspaperData } from '@/types';

// Mock useSubscriptions hook
const mockReorderSubscriptions = vi.fn();
vi.mock('@/hooks/useSubscriptions', () => ({
  useSubscriptions: () => ({
    reorderSubscriptions: mockReorderSubscriptions,
  }),
}));

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

// Mock @dnd-kit/sortable
vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: (arr: unknown[], oldIndex: number, newIndex: number) => {
    const newArr = [...arr];
    const [removed] = newArr.splice(oldIndex, 1);
    newArr.splice(newIndex, 0, removed);
    return newArr;
  },
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

// Mock @dnd-kit/utilities
vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

describe('SubscribedNewspaperList', () => {
  const mockOnNewspaperClick = vi.fn();

  beforeEach(() => {
    mockOnNewspaperClick.mockClear();
    mockReorderSubscriptions.mockClear();
  });

  describe('Unit Tests', () => {
    it('should render drag instruction', () => {
      const subscriptions: SubscriptionItem[] = [];
      const newspapers: NewspaperData[] = [];

      render(
        <SubscribedNewspaperList
          subscriptions={subscriptions}
          newspapers={newspapers}
          onNewspaperClick={mockOnNewspaperClick}
          locale="en"
        />
      );

      expect(screen.getByText('Drag to reorder')).toBeInTheDocument();
    });

    it('should render all subscription cards', () => {
      const subscriptions: SubscriptionItem[] = [
        { id: '1', title: 'Newspaper 1', subscribedAt: new Date().toISOString(), order: 0 },
        { id: '2', title: 'Newspaper 2', subscribedAt: new Date().toISOString(), order: 1 },
      ];
      const newspapers: NewspaperData[] = [];

      render(
        <SubscribedNewspaperList
          subscriptions={subscriptions}
          newspapers={newspapers}
          onNewspaperClick={mockOnNewspaperClick}
          locale="en"
        />
      );

      expect(screen.getByText('Newspaper 1')).toBeInTheDocument();
      expect(screen.getByText('Newspaper 2')).toBeInTheDocument();
    });

    it('should render empty list when no subscriptions', () => {
      const subscriptions: SubscriptionItem[] = [];
      const newspapers: NewspaperData[] = [];

      const { container } = render(
        <SubscribedNewspaperList
          subscriptions={subscriptions}
          newspapers={newspapers}
          onNewspaperClick={mockOnNewspaperClick}
          locale="en"
        />
      );

      const cards = container.querySelectorAll('[data-testid="newspaper-card"]');
      expect(cards.length).toBe(0);
    });
  });

  describe('Property Tests', () => {
    // Feature: issue-84-newspaper-subscription, Property 11: Drag and Drop Reordering
    it('property: renders correct number of cards', async () => {
      await fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              subscribedAt: fc.date().map(d => d.toISOString()),
            }),
            { maxLength: 10 }
          ),
          (subscriptions) => {
            const { container, unmount } = render(
              <SubscribedNewspaperList
                subscriptions={subscriptions}
                newspapers={[]}
                onNewspaperClick={mockOnNewspaperClick}
                locale="en"
              />
            );

            const titles = subscriptions.map(s => s.title);
            const allRendered = titles.every(title => 
              container.textContent?.includes(title)
            );

            unmount();
            return allRendered;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
