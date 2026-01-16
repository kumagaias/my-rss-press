# Design Document

## Overview

This document describes the design for implementing a newspaper subscription feature using browser localStorage. The feature allows users to save their favorite newspapers, manage them through a dedicated Subscribe page with drag-and-drop reordering, and automatically display their first subscribed newspaper on app launch.

The design follows the existing MyRSSPress architecture using Next.js 15 App Router, TypeScript, and Tailwind CSS, with a focus on responsive design and seamless integration with the current UI patterns.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              LocalStorage                             │  │
│  │  {                                                    │  │
│  │    subscriptions: [                                   │  │
│  │      { id: "newspaper-123", order: 0 },              │  │
│  │      { id: "newspaper-456", order: 1 }               │  │
│  │    ]                                                  │  │
│  │  }                                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ RootLayout   │  │  HomePage    │  │ NewspaperPage│     │
│  │ (Hamburger)  │  │ (Heart Icon) │  │ (Subscribe   │     │
│  │              │  │              │  │  Button)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           SubscribePage                               │  │
│  │  - Display subscribed newspapers                      │  │
│  │  - Drag & drop reordering                            │  │
│  │  - Empty state                                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  Custom Hooks & Services                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  useSubscriptions()                                   │  │
│  │  - getSubscriptions()                                 │  │
│  │  - addSubscription(id)                                │  │
│  │  - removeSubscription(id)                             │  │
│  │  - reorderSubscriptions(ids)                          │  │
│  │  - isSubscribed(id)                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
RootLayout (app/layout.tsx)
├── HamburgerMenu (new)
│   ├── Home Link
│   └── Subscribe Link
│
HomePage (app/page.tsx)
├── Header (existing)
├── PopularNewspapers (modified)
│   └── NewspaperCard (modified)
│       └── SubscribeButton (heart icon)
└── Footer (existing)

NewspaperPage (app/newspaper/page.tsx)
├── Header (modified)
│   └── SubscribeButton (text + icon)
└── NewspaperLayout (existing)

SubscribePage (app/subscribe/page.tsx) - NEW
├── Header
├── SubscribedNewspapersList
│   └── DraggableNewspaperCard[]
└── EmptyState
```

## Components and Interfaces

### 1. LocalStorage Service (`lib/subscriptionStorage.ts`)

**Purpose**: Manage subscription data in localStorage with type safety and error handling.

**Interface**:
```typescript
interface SubscriptionItem {
  id: string;
  order: number;
  subscribedAt: string; // ISO timestamp
}

interface SubscriptionStorage {
  subscriptions: SubscriptionItem[];
}

class SubscriptionStorageService {
  private readonly STORAGE_KEY = 'myrsspress_subscriptions';
  private readonly MAX_SUBSCRIPTIONS = 50;

  // Get all subscriptions sorted by order
  getSubscriptions(): SubscriptionItem[]
  
  // Add a subscription (returns false if limit reached)
  addSubscription(newspaperId: string): boolean
  
  // Remove a subscription
  removeSubscription(newspaperId: string): void
  
  // Check if newspaper is subscribed
  isSubscribed(newspaperId: string): boolean
  
  // Reorder subscriptions
  reorderSubscriptions(orderedIds: string[]): void
  
  // Get subscription count
  getCount(): number
  
  // Clear all subscriptions
  clearAll(): void
  
  // Validate and repair corrupted data
  private validateAndRepair(): void
}
```

**Implementation Details**:
- Store as JSON in localStorage under key `myrsspress_subscriptions`
- Validate data structure on every read
- Auto-repair corrupted data by resetting to empty array
- Enforce maximum 50 subscriptions limit
- Use ISO timestamps for `subscribedAt`
- Order field starts at 0 and increments

### 2. Custom Hook (`hooks/useSubscriptions.ts`)

**Purpose**: Provide React hook interface for subscription management with state synchronization.

**Interface**:
```typescript
interface UseSubscriptionsReturn {
  subscriptions: SubscriptionItem[];
  isSubscribed: (newspaperId: string) => boolean;
  addSubscription: (newspaperId: string) => boolean;
  removeSubscription: (newspaperId: string) => void;
  toggleSubscription: (newspaperId: string) => void;
  reorderSubscriptions: (orderedIds: string[]) => void;
  count: number;
  isAtLimit: boolean;
  isLoading: boolean;
}

function useSubscriptions(): UseSubscriptionsReturn
```

**Implementation Details**:
- Use `useState` to track subscriptions in component state
- Use `useEffect` to sync with localStorage on mount
- Provide memoized helper functions
- Handle localStorage unavailability gracefully
- Emit custom events for cross-component synchronization

### 3. Hamburger Menu Component (`components/ui/HamburgerMenu.tsx`)

**Purpose**: Provide navigation menu accessible from all pages.

**Interface**:
```typescript
interface HamburgerMenuProps {
  locale: Locale;
}

function HamburgerMenu({ locale }: HamburgerMenuProps): JSX.Element
```

**UI Specifications**:
- **Icon**: Three horizontal lines (☰), 24x24px minimum touch target
- **Position**: Top-left corner of header
- **Behavior**:
  - Click to open/close menu
  - Click outside to close
  - ESC key to close
- **Menu Items**:
  - Home (with home icon)
  - Subscribe (with heart icon)
- **Responsive**: Same design for desktop and mobile
- **Animation**: Slide-in from left (200ms ease-out)

**Styling**:
- Menu overlay: Semi-transparent black background
- Menu panel: White background, 280px width
- Border: 4px black border (consistent with app style)
- Font: Serif, bold for menu items
- Hover: Gray background on menu items

### 4. Subscribe Button Component (`components/features/subscription/SubscribeButton.tsx`)

**Purpose**: Toggle subscription status with visual feedback.

**Interface**:
```typescript
interface SubscribeButtonProps {
  newspaperId: string;
  variant: 'icon-only' | 'full'; // icon-only for home, full for newspaper page
  locale: Locale;
  className?: string;
}

function SubscribeButton({ 
  newspaperId, 
  variant, 
  locale,
  className 
}: SubscribeButtonProps): JSX.Element
```

**UI Specifications**:

**Icon-Only Variant** (for home page):
- Size: 32x32px minimum (44x44px touch target)
- Icon: Heart outline (not subscribed) / Filled heart (subscribed)
- Color: Black outline / Red fill
- Position: Top-right corner of newspaper card
- Hover: Scale 1.1x
- Click: Toggle with 200ms scale animation

**Full Variant** (for newspaper page):
- Size: Auto width, 44px height minimum
- Layout: Icon + Text
- Text: "Subscribe" / "Subscribed"
- Icon: Heart outline / Filled heart
- Color: Black border, white background / Red background, white text
- Position: Header, next to "Back to Home" button
- Hover: Background color change
- Click: Toggle with visual feedback

**Behavior**:
- Optimistic UI update (instant visual feedback)
- Show toast notification on success
- Handle limit reached (show error message)
- Sync across all instances via custom event

### 5. Subscribe Page (`app/subscribe/page.tsx`)

**Purpose**: Display and manage subscribed newspapers with drag-and-drop reordering.

**Interface**:
```typescript
function SubscribePage(): JSX.Element
```

**UI Specifications**:

**Layout**:
- Header: Same as other pages with hamburger menu
- Title: "Subscribed Newspapers" / "購読中の新聞"
- Grid: Responsive (1 column mobile, 2-3 columns desktop)
- Empty State: Centered message with icon

**Newspaper Cards**:
- Same design as PopularNewspapers cards
- Add drag handle icon (⋮⋮) on left side
- Show subscription date below other metadata
- Click to navigate to newspaper
- Drag to reorder

**Drag and Drop**:
- Visual feedback: Card elevation and opacity change
- Drop indicator: Blue line showing drop position
- Touch support: Long press (500ms) to start drag
- Auto-scroll: When dragging near viewport edges
- Persist order immediately on drop

**Empty State**:
- Icon: Empty newspaper icon
- Message: "No subscribed newspapers yet"
- CTA: "Browse popular newspapers" button → Navigate to home

### 6. Initial Display Logic (`app/layout.tsx` or middleware)

**Purpose**: Redirect to first subscribed newspaper on app launch.

**Implementation**:
```typescript
// In app/page.tsx or layout.tsx
useEffect(() => {
  // Check if this is initial page load (not navigation)
  const isInitialLoad = !sessionStorage.getItem('app_initialized');
  
  if (isInitialLoad) {
    sessionStorage.setItem('app_initialized', 'true');
    
    // Get subscriptions
    const subscriptions = subscriptionStorage.getSubscriptions();
    
    if (subscriptions.length > 0) {
      // Navigate to first subscribed newspaper
      const firstNewspaper = subscriptions[0];
      router.push(`/newspaper?id=${firstNewspaper.id}`);
    }
  }
}, []);
```

**Behavior**:
- Only trigger on initial app load (not on navigation)
- Use sessionStorage flag to track initialization
- Navigate to first subscription if exists
- Fall back to home page if no subscriptions
- Handle navigation errors gracefully

## Data Models

### LocalStorage Schema

```typescript
// Key: "myrsspress_subscriptions"
{
  "subscriptions": [
    {
      "id": "newspaper-abc123",
      "order": 0,
      "subscribedAt": "2026-01-16T00:00:00.000Z"
    },
    {
      "id": "newspaper-def456",
      "order": 1,
      "subscribedAt": "2026-01-16T01:00:00.000Z"
    }
  ]
}
```

### Type Definitions

```typescript
// Add to frontend/types/index.ts

export interface SubscriptionItem {
  id: string;
  order: number;
  subscribedAt: string;
}

export interface SubscriptionStorage {
  subscriptions: SubscriptionItem[];
}
```

### Translation Keys

```typescript
// Add to frontend/lib/i18n.ts

export const translations = {
  en: {
    // ... existing translations
    
    // Subscription
    subscribe: 'Subscribe',
    subscribed: 'Subscribed',
    subscribedNewspapers: 'Subscribed Newspapers',
    subscriptionLimitReached: 'You can subscribe to a maximum of 50 newspapers',
    noSubscriptions: 'No subscribed newspapers yet',
    browsePopular: 'Browse Popular Newspapers',
    subscribedOn: 'Subscribed on',
    dragToReorder: 'Drag to reorder',
    
    // Menu
    menu: 'Menu',
    closeMenu: 'Close Menu',
  },
  ja: {
    // ... existing translations
    
    // Subscription
    subscribe: '購読',
    subscribed: '購読中',
    subscribedNewspapers: '購読中の新聞',
    subscriptionLimitReached: '購読できる新聞は最大50件です',
    noSubscriptions: '購読中の新聞はありません',
    browsePopular: '人気の新聞を見る',
    subscribedOn: '購読日',
    dragToReorder: 'ドラッグして並び替え',
    
    // Menu
    menu: 'メニュー',
    closeMenu: 'メニューを閉じる',
  },
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Subscription Persistence

*For any* newspaper ID, when a user subscribes to it, the newspaper ID should be stored in localStorage and retrievable on subsequent reads.

**Validates: Requirements 1.1, 1.4**

### Property 2: Unsubscription Removal

*For any* subscribed newspaper ID, when a user unsubscribes from it, the newspaper ID should no longer exist in localStorage.

**Validates: Requirements 1.2**

### Property 3: Order Persistence

*For any* list of subscribed newspaper IDs, when the user reorders them, the new order should be persisted to localStorage and match exactly when retrieved.

**Validates: Requirements 1.3, 6.4, 6.5**

### Property 4: JSON Schema Validation

*For any* subscription data in localStorage, it should conform to the expected JSON schema with a subscriptions array containing objects with id, order, and subscribedAt fields.

**Validates: Requirements 1.5**

### Property 5: Subscription Toggle Idempotence

*For any* newspaper ID, toggling subscription twice (subscribe then unsubscribe, or unsubscribe then subscribe) should return to the original state.

**Validates: Requirements 2.4, 3.4**

### Property 6: LocalStorage Synchronization

*For any* subscription state change, localStorage should be updated immediately (synchronously) before the function returns.

**Validates: Requirements 2.5, 3.5**

### Property 7: Visual State Consistency

*For any* newspaper, the displayed icon/button state (outlined vs filled heart, "Subscribe" vs "Subscribed" text) should match the subscription state in localStorage.

**Validates: Requirements 2.2, 2.3, 3.2, 3.3, 8.2, 8.3**

### Property 8: Menu Navigation Behavior

*For any* menu item click (Home or Subscribe), the system should navigate to the correct page and close the menu.

**Validates: Requirements 4.4, 4.5**

### Property 9: Click-Outside Menu Closure

*For any* click event outside the menu boundaries when the menu is open, the menu should close.

**Validates: Requirements 4.6**

### Property 10: Subscribe Page Display Completeness

*For any* set of subscribed newspapers, the subscribe page should display all and only those newspapers that are in the subscription list.

**Validates: Requirements 5.1, 8.4**

### Property 11: Display Order Consistency

*For any* subscribed newspapers with a defined order, the display order on the subscribe page should match the order stored in localStorage.

**Validates: Requirements 5.4**

### Property 12: Card Content Completeness

*For any* displayed newspaper card on the subscribe page, it should contain title, date, and thumbnail (if available) fields.

**Validates: Requirements 5.3**

### Property 13: Initial Navigation Logic

*For any* app initialization, if subscriptions exist, the system should navigate to the first subscribed newspaper; otherwise, it should display the home page.

**Validates: Requirements 7.1, 7.2, 7.4**

### Property 14: Auto-Navigation Date Parameter

*For any* automatic navigation to a subscribed newspaper, the system should include the current date as a query parameter.

**Validates: Requirements 7.3**

### Property 15: Load Failure Fallback

*For any* subscribed newspaper that fails to load, the system should fall back to displaying the home page.

**Validates: Requirements 7.5**

### Property 16: Cross-Component State Synchronization

*For any* subscription status change, all UI components displaying that newspaper's subscription state should update to reflect the new state.

**Validates: Requirements 8.1**

### Property 17: Data Validation on Load

*For any* page load, the system should validate subscription data from localStorage and handle corrupted data by resetting to an empty list.

**Validates: Requirements 8.5, 9.3**

### Property 18: Performance Constraint

*For any* subscription toggle operation, the operation should complete within 100ms.

**Validates: Requirements 9.1**

### Property 19: Missing Newspaper Handling

*For any* subscribed newspaper that no longer exists in the backend, the system should handle the error gracefully without crashing.

**Validates: Requirements 9.4**

### Property 20: Subscription Limit Enforcement

*For any* attempt to subscribe when already at 50 subscriptions, the system should prevent the subscription and display an error message.

**Validates: Requirements 9.5**



## Error Handling

### LocalStorage Errors

**Scenario**: LocalStorage is unavailable (blocked by browser, private mode, quota exceeded)

**Handling**:
1. Detect localStorage availability on app initialization
2. Set global flag `isLocalStorageAvailable`
3. Display warning banner: "Subscription feature is unavailable"
4. Disable all subscription buttons (show disabled state)
5. Log error to console for debugging

**Implementation**:
```typescript
function checkLocalStorageAvailability(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}
```

### Data Corruption

**Scenario**: LocalStorage data is corrupted or invalid JSON

**Handling**:
1. Wrap all localStorage reads in try-catch
2. Validate JSON structure after parsing
3. If invalid, reset to empty subscription list
4. Log warning to console
5. Show toast notification: "Subscription data was reset"

**Validation**:
```typescript
function validateSubscriptionData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.subscriptions)) return false;
  
  return data.subscriptions.every((item: any) => 
    typeof item.id === 'string' &&
    typeof item.order === 'number' &&
    typeof item.subscribedAt === 'string'
  );
}
```

### Network Errors

**Scenario**: Subscribed newspaper fails to load from backend

**Handling**:
1. Show error message on newspaper page
2. Provide "Remove from subscriptions" button
3. Provide "Try again" button
4. Provide "Back to home" button
5. Do not automatically remove from subscriptions

### Subscription Limit

**Scenario**: User attempts to subscribe when at 50 newspaper limit

**Handling**:
1. Prevent subscription action
2. Show toast notification with limit message
3. Suggest removing old subscriptions
4. Provide link to subscribe page for management

### Race Conditions

**Scenario**: Multiple tabs/windows modifying subscriptions simultaneously

**Handling**:
1. Listen to `storage` event for cross-tab synchronization
2. Reload subscription state when storage event detected
3. Show notification: "Subscriptions updated in another tab"
4. Update UI to reflect latest state

**Implementation**:
```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'myrsspress_subscriptions') {
      // Reload subscriptions from localStorage
      loadSubscriptions();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

## Testing Strategy

### Unit Tests

**LocalStorage Service** (`lib/subscriptionStorage.test.ts`):
- Test CRUD operations (add, remove, get, reorder)
- Test data validation and corruption handling
- Test limit enforcement (50 subscriptions)
- Test localStorage unavailability handling
- Mock localStorage for isolated testing

**Custom Hook** (`hooks/useSubscriptions.test.ts`):
- Test hook state management
- Test subscription toggle logic
- Test cross-component synchronization
- Test error handling
- Use React Testing Library

**Components**:
- `SubscribeButton.test.tsx`: Test icon/text variants, click behavior
- `HamburgerMenu.test.tsx`: Test menu open/close, navigation
- `SubscribePage.test.tsx`: Test newspaper display, empty state

### Property-Based Tests

**Test Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Test 1: Subscription Round Trip**
```typescript
// Feature: issue-84-newspaper-subscription, Property 1: Subscription Persistence
test('subscription round trip', () => {
  fc.assert(
    fc.property(fc.array(fc.string(), { minLength: 1, maxLength: 50 }), (ids) => {
      // Subscribe to all IDs
      ids.forEach(id => storage.addSubscription(id));
      
      // Retrieve subscriptions
      const retrieved = storage.getSubscriptions().map(s => s.id);
      
      // Should contain all subscribed IDs
      return ids.every(id => retrieved.includes(id));
    }),
    { numRuns: 100 }
  );
});
```

**Property Test 2: Unsubscription Removal**
```typescript
// Feature: issue-84-newspaper-subscription, Property 2: Unsubscription Removal
test('unsubscription removes ID', () => {
  fc.assert(
    fc.property(fc.string(), (id) => {
      storage.addSubscription(id);
      storage.removeSubscription(id);
      return !storage.isSubscribed(id);
    }),
    { numRuns: 100 }
  );
});
```

**Property Test 3: Order Preservation**
```typescript
// Feature: issue-84-newspaper-subscription, Property 3: Order Persistence
test('order preservation', () => {
  fc.assert(
    fc.property(fc.array(fc.string(), { minLength: 2, maxLength: 10 }), (ids) => {
      // Add subscriptions
      ids.forEach(id => storage.addSubscription(id));
      
      // Reorder
      const shuffled = [...ids].sort(() => Math.random() - 0.5);
      storage.reorderSubscriptions(shuffled);
      
      // Verify order
      const retrieved = storage.getSubscriptions().map(s => s.id);
      return JSON.stringify(retrieved) === JSON.stringify(shuffled);
    }),
    { numRuns: 100 }
  );
});
```

**Property Test 4: Toggle Idempotence**
```typescript
// Feature: issue-84-newspaper-subscription, Property 5: Subscription Toggle Idempotence
test('toggle idempotence', () => {
  fc.assert(
    fc.property(fc.string(), (id) => {
      const initialState = storage.isSubscribed(id);
      
      // Toggle twice
      storage.isSubscribed(id) 
        ? storage.removeSubscription(id) 
        : storage.addSubscription(id);
      storage.isSubscribed(id) 
        ? storage.removeSubscription(id) 
        : storage.addSubscription(id);
      
      // Should return to initial state
      return storage.isSubscribed(id) === initialState;
    }),
    { numRuns: 100 }
  );
});
```

**Property Test 5: Limit Enforcement**
```typescript
// Feature: issue-84-newspaper-subscription, Property 20: Subscription Limit Enforcement
test('subscription limit enforcement', () => {
  fc.assert(
    fc.property(fc.array(fc.string(), { minLength: 51, maxLength: 100 }), (ids) => {
      storage.clearAll();
      
      // Try to add more than 50
      const results = ids.map(id => storage.addSubscription(id));
      
      // First 50 should succeed, rest should fail
      const successCount = results.filter(r => r === true).length;
      return successCount === 50 && storage.getCount() === 50;
    }),
    { numRuns: 100 }
  );
});
```

### Integration Tests

**E2E Tests** (Playwright):
1. **Subscription Flow**:
   - Navigate to home page
   - Click heart icon on newspaper card
   - Verify icon changes to filled
   - Navigate to subscribe page
   - Verify newspaper appears in list

2. **Drag and Drop**:
   - Navigate to subscribe page with multiple subscriptions
   - Drag newspaper card to new position
   - Verify order changes
   - Reload page
   - Verify order persists

3. **Initial Navigation**:
   - Clear localStorage
   - Navigate to home
   - Subscribe to a newspaper
   - Reload app
   - Verify redirected to subscribed newspaper

4. **Cross-Tab Synchronization**:
   - Open app in two tabs
   - Subscribe in tab 1
   - Verify subscription appears in tab 2

### Manual Testing Checklist

- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on iOS Safari, Android Chrome
- [ ] Test with localStorage disabled
- [ ] Test with 50+ subscription attempts
- [ ] Test drag and drop on touch devices
- [ ] Test hamburger menu on mobile
- [ ] Test responsive layouts at various breakpoints
- [ ] Test with slow network (newspaper loading)
- [ ] Test with corrupted localStorage data
- [ ] Test cross-tab synchronization

### Coverage Goals

- **Unit Test Coverage**: 80% minimum
- **Property Test Coverage**: All core properties (20 properties)
- **E2E Test Coverage**: Critical user flows (4 flows)
- **Manual Test Coverage**: All devices and browsers

## Implementation Notes

### Dependencies

**New Dependencies**:
- `@dnd-kit/core`: ^6.0.0 (Drag and drop)
- `@dnd-kit/sortable`: ^7.0.0 (Sortable lists)
- `@dnd-kit/utilities`: ^3.2.0 (Utilities)
- `fast-check`: ^3.15.0 (Property-based testing, dev dependency)

**Existing Dependencies**:
- React 18+
- Next.js 15+
- TypeScript 5.9+
- Tailwind CSS 3+

### File Structure

```
frontend/
├── app/
│   ├── layout.tsx (modified - add HamburgerMenu)
│   ├── page.tsx (modified - add initial navigation logic)
│   └── subscribe/
│       └── page.tsx (new)
├── components/
│   ├── ui/
│   │   └── HamburgerMenu.tsx (new)
│   └── features/
│       ├── subscription/
│       │   ├── SubscribeButton.tsx (new)
│       │   └── DraggableNewspaperCard.tsx (new)
│       └── home/
│           └── PopularNewspapers.tsx (modified - add SubscribeButton)
├── hooks/
│   └── useSubscriptions.ts (new)
├── lib/
│   ├── subscriptionStorage.ts (new)
│   └── i18n.ts (modified - add translations)
└── types/
    └── index.ts (modified - add SubscriptionItem type)
```

### Performance Considerations

1. **LocalStorage Access**: Minimize reads/writes, cache in memory
2. **Drag and Drop**: Use `will-change` CSS for smooth animations
3. **Re-renders**: Memoize subscription checks with `useMemo`
4. **Event Listeners**: Clean up storage event listeners properly
5. **Initial Navigation**: Use sessionStorage flag to prevent repeated checks

### Accessibility

1. **Keyboard Navigation**:
   - Tab through subscribe buttons
   - Enter/Space to toggle subscription
   - Arrow keys for drag and drop (with keyboard mode)
   - ESC to close hamburger menu

2. **Screen Readers**:
   - ARIA labels for subscribe buttons
   - ARIA live regions for subscription status changes
   - ARIA labels for drag handles
   - Semantic HTML for menu navigation

3. **Focus Management**:
   - Focus trap in hamburger menu
   - Focus return after menu close
   - Visible focus indicators

### Migration Strategy

**Phase 1**: Implement core functionality (localStorage, buttons, subscribe page)
**Phase 2**: Add drag and drop
**Phase 3**: Add initial navigation logic
**Phase 4**: Polish and accessibility improvements

**Future Enhancement**: When user authentication is implemented, migrate localStorage data to backend database.
