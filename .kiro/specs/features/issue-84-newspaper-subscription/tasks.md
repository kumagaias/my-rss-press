# Implementation Plan: Newspaper Subscription Feature

## Overview

This implementation plan breaks down the newspaper subscription feature into discrete coding tasks. The feature will be implemented in TypeScript using Next.js 15, React 18, and Tailwind CSS, following the existing MyRSSPress architecture.

## Tasks

- [x] 1. Set up project dependencies and type definitions
  - Install @dnd-kit packages for drag and drop functionality
  - Install fast-check for property-based testing
  - Add SubscriptionItem and SubscriptionStorage types to frontend/types/index.ts
  - Add subscription-related translation keys to frontend/lib/i18n.ts
  - _Requirements: 1.5, 6.1_

- [x] 2. Implement LocalStorage service
  - [x] 2.1 Create subscriptionStorage.ts service
    - Implement SubscriptionStorageService class with CRUD operations
    - Add data validation and corruption handling
    - Implement 50 subscription limit enforcement
    - Add localStorage availability check
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.2, 9.3, 9.5_

  - [x] 2.2 Write property test for subscription persistence
    - **Property 1: Subscription Persistence**
    - **Validates: Requirements 1.1, 1.4**

  - [x] 2.3 Write property test for unsubscription removal
    - **Property 2: Unsubscription Removal**
    - **Validates: Requirements 1.2**

  - [x] 2.4 Write property test for order persistence
    - **Property 3: Order Persistence**
    - **Validates: Requirements 1.3, 6.4, 6.5**

  - [x] 2.5 Write property test for JSON schema validation
    - **Property 4: JSON Schema Validation**
    - **Validates: Requirements 1.5**

  - [x] 2.6 Write property test for subscription limit enforcement
    - **Property 20: Subscription Limit Enforcement**
    - **Validates: Requirements 9.5**

- [x] 3. Create custom subscription hook
  - [x] 3.1 Implement useSubscriptions hook
    - Create hooks/useSubscriptions.ts
    - Implement state management with useState
    - Add subscription CRUD operations
    - Add cross-tab synchronization with storage event
    - Add localStorage availability handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1_

  - [x] 3.2 Write unit tests for useSubscriptions hook
    - Test state management
    - Test subscription toggle logic
    - Test cross-component synchronization
    - Test error handling
    - _Requirements: 1.1, 1.2, 1.3, 8.1_

  - [x] 3.3 Write property test for toggle idempotence
    - **Property 5: Subscription Toggle Idempotence**
    - **Validates: Requirements 2.4, 3.4**

- [x] 4. Implement SubscribeButton component
  - [x] 4.1 Create SubscribeButton component
    - Create components/features/subscription/SubscribeButton.tsx
    - Implement icon-only variant (heart icon for home page)
    - Implement full variant (text + icon for newspaper page)
    - Add click handler with optimistic UI update
    - Add toast notification for limit reached
    - Use useSubscriptions hook
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 4.2 Write unit tests for SubscribeButton
    - Test icon-only variant rendering
    - Test full variant rendering
    - Test click behavior
    - Test visual state consistency
    - _Requirements: 2.2, 2.3, 3.2, 3.3_

  - [x] 4.3 Write property test for visual state consistency
    - **Property 7: Visual State Consistency**
    - **Validates: Requirements 2.2, 2.3, 3.2, 3.3, 8.2, 8.3**

  - [x] 4.4 Write property test for localStorage synchronization
    - **Property 6: LocalStorage Synchronization**
    - **Validates: Requirements 2.5, 3.5**

- [x] 5. Checkpoint - Ensure subscription button tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate SubscribeButton into existing pages
  - [x] 6.1 Add SubscribeButton to PopularNewspapers component
    - Modify components/features/home/PopularNewspapers.tsx
    - Add SubscribeButton (icon-only variant) to each newspaper card
    - Position in top-right corner of card
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.2 Add SubscribeButton to NewspaperPage
    - Modify app/newspaper/page.tsx
    - Add SubscribeButton (full variant) to header
    - Position next to "Back to Home" button
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.3 Write integration tests for button integration
    - Test button appears on home page cards
    - Test button appears on newspaper page
    - Test subscription state synchronization across pages
    - _Requirements: 2.1, 3.1, 8.1_

- [x] 7. Implement HamburgerMenu component
  - [x] 7.1 Create HamburgerMenu component
    - Create components/ui/HamburgerMenu.tsx
    - Implement menu icon (☰) with 44x44px touch target
    - Implement slide-in menu panel (280px width)
    - Add Home and Subscribe menu items with icons
    - Add click-outside-to-close functionality
    - Add ESC key to close
    - Add navigation on menu item click
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 7.2 Write unit tests for HamburgerMenu
    - Test menu open/close behavior
    - Test navigation on menu item click
    - Test click-outside behavior
    - Test ESC key behavior
    - _Requirements: 4.2, 4.4, 4.5, 4.6_

  - [x] 7.3 Write property test for menu navigation
    - **Property 8: Menu Navigation Behavior**
    - **Validates: Requirements 4.4, 4.5**

  - [x] 7.4 Write property test for click-outside closure
    - **Property 9: Click-Outside Menu Closure**
    - **Validates: Requirements 4.6**

- [x] 8. Integrate HamburgerMenu into layout
  - [x] 8.1 Add HamburgerMenu to RootLayout
    - Modify app/layout.tsx
    - Add HamburgerMenu component to header
    - Position in top-left corner
    - Ensure responsive design (same for desktop and mobile)
    - _Requirements: 4.1, 4.7_

  - [x] 8.2 Write integration tests for menu integration
    - Test menu appears on all pages
    - Test navigation works from different pages
    - _Requirements: 4.1, 4.4, 4.5_

- [x] 9. Checkpoint - Ensure navigation tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Subscribe page
  - [x] 10.1 Create Subscribe page component
    - Create app/subscribe/page.tsx
    - Implement page layout with header
    - Add title "Subscribed Newspapers"
    - Fetch subscribed newspapers from backend
    - Display newspaper cards in responsive grid
    - Implement empty state with message and CTA button
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.2 Write unit tests for Subscribe page
    - Test newspaper display
    - Test empty state
    - Test card content completeness
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 10.3 Write property test for display completeness
    - **Property 10: Subscribe Page Display Completeness**
    - **Validates: Requirements 5.1, 8.4**

  - [x] 10.4 Write property test for card content
    - **Property 12: Card Content Completeness**
    - **Validates: Requirements 5.3**

- [x] 11. Implement drag and drop functionality
  - [x] 11.1 Create DraggableNewspaperCard component
    - Create components/features/subscription/DraggableNewspaperCard.tsx
    - Use @dnd-kit/sortable for drag and drop
    - Add drag handle icon (⋮⋮)
    - Implement visual feedback during drag
    - Add touch support with long press (500ms)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [x] 11.2 Integrate drag and drop into Subscribe page
    - Modify app/subscribe/page.tsx
    - Replace static cards with DraggableNewspaperCard
    - Implement onDragEnd handler
    - Update localStorage on drop
    - Add auto-scroll near viewport edges
    - _Requirements: 6.1, 6.4, 6.5_

  - [x] 11.3 Write unit tests for drag and drop
    - Test drag start behavior
    - Test drop behavior
    - Test order update
    - _Requirements: 6.1, 6.4_

  - [x] 11.4 Write property test for display order consistency
    - **Property 11: Display Order Consistency**
    - **Validates: Requirements 5.4**

- [x] 12. Implement initial navigation logic
  - [x] 12.1 Add initial navigation to home page
    - Modify app/page.tsx
    - Add useEffect to check subscriptions on mount
    - Use sessionStorage flag to detect initial load
    - Navigate to first subscribed newspaper if exists
    - Add current date parameter to navigation
    - Handle navigation errors with fallback to home
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 12.2 Write unit tests for initial navigation
    - Test navigation with subscriptions
    - Test no navigation without subscriptions
    - Test date parameter inclusion
    - Test error fallback
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [x] 12.3 Write property test for initial navigation logic
    - **Property 13: Initial Navigation Logic**
    - **Validates: Requirements 7.1, 7.2, 7.4**

  - [x] 12.4 Write property test for auto-navigation date parameter
    - **Property 14: Auto-Navigation Date Parameter**
    - **Validates: Requirements 7.3**

  - [x] 12.5 Write property test for load failure fallback
    - **Property 15: Load Failure Fallback**
    - **Validates: Requirements 7.5**

- [x] 13. Checkpoint - Ensure all core functionality tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Implement cross-component synchronization
  - [x] 14.1 Add storage event listener to useSubscriptions
    - Modify hooks/useSubscriptions.ts
    - Listen to window storage event
    - Reload subscriptions on storage change
    - Show toast notification for cross-tab updates
    - _Requirements: 8.1_

  - [x] 14.2 Write property test for cross-component synchronization
    - **Property 16: Cross-Component State Synchronization**
    - **Validates: Requirements 8.1**

- [x] 15. Implement data validation and error handling
  - [x] 15.1 Add data validation on page load
    - Modify hooks/useSubscriptions.ts
    - Validate subscription data structure
    - Handle corrupted data by resetting
    - Log validation errors
    - _Requirements: 8.5, 9.3_

  - [x] 15.2 Add missing newspaper error handling
    - Modify app/subscribe/page.tsx
    - Handle 404 errors when fetching newspapers
    - Display error message for missing newspapers
    - Provide "Remove from subscriptions" option
    - _Requirements: 9.4_

  - [x] 15.3 Write property test for data validation
    - **Property 17: Data Validation on Load**
    - **Validates: Requirements 8.5, 9.3**

  - [x] 15.4 Write property test for missing newspaper handling
    - **Property 19: Missing Newspaper Handling**
    - **Validates: Requirements 9.4**

- [x] 16. Implement performance optimizations
  - [x] 16.1 Add performance monitoring
    - Add performance.now() timing to subscription operations
    - Log operations exceeding 100ms threshold
    - Optimize localStorage access with caching
    - _Requirements: 9.1_

  - [x] 16.2 Write property test for performance constraint
    - **Property 18: Performance Constraint**
    - **Validates: Requirements 9.1**

- [x] 17. Add accessibility features
  - [x] 17.1 Add keyboard navigation support
    - Add keyboard handlers to HamburgerMenu (ESC to close)
    - Add keyboard handlers to SubscribeButton (Enter/Space)
    - Add ARIA labels to all interactive elements
    - Add focus trap to hamburger menu
    - Ensure visible focus indicators
    - _Requirements: 4.6_

  - [x] 17.2 Add screen reader support
    - Add ARIA live regions for subscription status changes
    - Add ARIA labels for drag handles
    - Use semantic HTML for menu navigation
    - Test with screen reader
    - _Requirements: 2.4, 3.4, 6.1_

- [ ] 18. Write E2E tests
  - [ ] 18.1 Write E2E test for subscription flow
    - Navigate to home page
    - Click heart icon on newspaper card
    - Verify icon changes to filled
    - Navigate to subscribe page
    - Verify newspaper appears in list
    - _Requirements: 2.1, 2.4, 5.1_

  - [ ] 18.2 Write E2E test for drag and drop
    - Navigate to subscribe page with multiple subscriptions
    - Drag newspaper card to new position
    - Verify order changes
    - Reload page
    - Verify order persists
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ] 18.3 Write E2E test for initial navigation
    - Clear localStorage
    - Navigate to home
    - Subscribe to a newspaper
    - Reload app
    - Verify redirected to subscribed newspaper
    - _Requirements: 7.1, 7.4_

  - [ ] 18.4 Write E2E test for cross-tab synchronization
    - Open app in two tabs
    - Subscribe in tab 1
    - Verify subscription appears in tab 2
    - _Requirements: 8.1_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Polish and final integration
  - [ ] 20.1 Add loading states and animations
    - Add loading spinner for subscribe page
    - Add transition animations for drag and drop
    - Add toast notifications for all actions
    - _Requirements: 5.1, 6.2_

  - [ ] 20.2 Responsive design verification
    - Test on mobile devices (320px-768px)
    - Test on tablet devices (768px-1024px)
    - Test on desktop (1024px+)
    - Verify touch targets are 44x44px minimum
    - _Requirements: 4.7, 5.5_

  - [ ] 20.3 Browser compatibility testing
    - Test on Chrome, Firefox, Safari
    - Test on iOS Safari, Android Chrome
    - Test with localStorage disabled
    - Fix any browser-specific issues
    - _Requirements: 9.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- E2E tests validate complete user flows
