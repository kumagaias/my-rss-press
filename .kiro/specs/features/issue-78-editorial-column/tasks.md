# Tasks Document - Issue #78: Editorial Column

**Related Documents:**
- [Requirements Document](./requirements.md)
- [Design Document](./design.md)
- [Issue #78](https://github.com/kumagaias/my-rss-press/issues/78)

## Task Breakdown

### Phase 1: Backend Service Implementation

#### Task 1.1: Create Editorial Column Service
**File:** `backend/src/services/editorialColumnService.ts`

**Subtasks:**
- [ ] Create service file with TypeScript interfaces
- [ ] Implement `generateEditorialColumn()` function
- [ ] Implement `buildEditorialPrompt()` helper function
- [ ] Add English prompt template (editorial style)
- [ ] Add Japanese prompt template (コラム style)
- [ ] Integrate with AWS Bedrock (Claude 3 Haiku)
- [ ] Add error handling and graceful degradation
- [ ] Add timeout handling (5 seconds)
- [ ] Add logging for debugging

**Acceptance Criteria:**
- Service generates 150-200 word editorial columns
- Supports both English and Japanese
- Includes historical/philosophical references
- Returns null on failure (graceful degradation)
- Logs generation status and errors

**Estimated Time:** 2 hours

---

#### Task 1.2: Create Unit Tests for Editorial Service
**File:** `backend/tests/unit/services/editorialColumnService.test.ts`

**Subtasks:**
- [ ] Test prompt generation for English
- [ ] Test prompt generation for Japanese
- [ ] Test Bedrock integration (mock)
- [ ] Test error handling
- [ ] Test timeout handling
- [ ] Test graceful degradation
- [ ] Test response parsing

**Acceptance Criteria:**
- All tests pass
- Coverage > 80%
- Tests cover both success and failure cases

**Estimated Time:** 1.5 hours

---

### Phase 2: API Integration

#### Task 2.1: Update Newspaper Generation Endpoint
**File:** `backend/src/routes/newspapers.ts`

**Subtasks:**
- [ ] Import `generateEditorialColumn` service
- [ ] Add editorial column generation to `/api/newspapers/generate`
- [ ] Generate column in parallel with summary
- [ ] Handle generation failures gracefully
- [ ] Include `editorialColumn` in response
- [ ] Add logging for editorial column generation

**Acceptance Criteria:**
- Editorial column is generated during newspaper creation
- Generation doesn't block other operations
- Failures don't prevent newspaper generation
- Response includes `editorialColumn` field (optional)

**Estimated Time:** 1 hour

---

#### Task 2.2: Update Historical Newspaper Service
**File:** `backend/src/services/historicalNewspaperService.ts`

**Subtasks:**
- [ ] Import `generateEditorialColumn` service
- [ ] Add editorial column generation to `getOrCreateNewspaper()`
- [ ] Handle generation failures gracefully
- [ ] Store column in DynamoDB
- [ ] Add logging

**Acceptance Criteria:**
- Historical newspapers include editorial columns
- Columns are stored and retrieved correctly
- Failures don't prevent newspaper creation

**Estimated Time:** 1 hour

---

#### Task 2.3: Update Database Schema
**File:** `backend/src/models/newspaper.ts`

**Subtasks:**
- [ ] Add `editorialColumn?: string` field to `NewspaperData` interface
- [ ] Update TypeScript types
- [ ] Verify backward compatibility

**Acceptance Criteria:**
- Schema includes optional `editorialColumn` field
- Existing newspapers continue to work
- TypeScript compilation succeeds

**Estimated Time:** 15 minutes

---

#### Task 2.4: Update API Tests
**Files:**
- `backend/tests/unit/routes/newspapers-generate.test.ts`
- `backend/tests/integration/routes/newspapers.test.ts`

**Subtasks:**
- [ ] Update test expectations to include `editorialColumn`
- [ ] Test newspaper generation with editorial column
- [ ] Test historical newspaper with editorial column
- [ ] Test graceful degradation when column generation fails
- [ ] Verify backward compatibility

**Acceptance Criteria:**
- All existing tests pass
- New tests cover editorial column functionality
- Tests verify graceful degradation

**Estimated Time:** 1 hour

---

### Phase 3: Frontend Implementation

#### Task 3.1: Create Editorial Column Component
**File:** `frontend/components/features/newspaper/EditorialColumn.tsx`

**Subtasks:**
- [ ] Create component file
- [ ] Implement styled box with border and background
- [ ] Add multi-language title support
- [ ] Parse title and content from column text
- [ ] Add responsive design (mobile/desktop)
- [ ] Use serif font for traditional feel
- [ ] Add proper spacing and layout

**Acceptance Criteria:**
- Component displays editorial column beautifully
- Works on mobile and desktop
- Supports English and Japanese
- Matches newspaper aesthetic

**Estimated Time:** 1.5 hours

---

#### Task 3.2: Update Newspaper Layout
**File:** `frontend/components/features/newspaper/NewspaperLayout.tsx`

**Subtasks:**
- [ ] Import `EditorialColumn` component
- [ ] Add `editorialColumn` prop to interface
- [ ] Render editorial column at bottom (after remaining articles)
- [ ] Add conditional rendering (only if column exists)
- [ ] Add proper spacing and borders

**Acceptance Criteria:**
- Editorial column appears at bottom of newspaper
- Only renders when column exists
- Maintains proper layout and spacing
- Works with existing newspaper sections

**Estimated Time:** 30 minutes

---

#### Task 3.3: Update Translations
**File:** `frontend/lib/i18n.ts`

**Subtasks:**
- [ ] Add English translations for editorial column
- [ ] Add Japanese translations for editorial column
- [ ] Add section labels

**Acceptance Criteria:**
- All UI text is translated
- Translations are accurate and natural

**Estimated Time:** 15 minutes

---

#### Task 3.4: Update Type Definitions
**File:** `frontend/types/index.ts`

**Subtasks:**
- [ ] Add `editorialColumn?: string` to `Newspaper` interface
- [ ] Update TypeScript types
- [ ] Verify type safety

**Acceptance Criteria:**
- Types include editorial column
- TypeScript compilation succeeds
- Type safety is maintained

**Estimated Time:** 10 minutes

---

### Phase 4: Testing & Deployment

#### Task 4.1: Manual Testing
**Subtasks:**
- [ ] Test newspaper generation with editorial column (English)
- [ ] Test newspaper generation with editorial column (Japanese)
- [ ] Test historical newspapers with editorial column
- [ ] Test graceful degradation (Bedrock failure)
- [ ] Test visual design on desktop
- [ ] Test visual design on mobile
- [ ] Test content quality and coherence
- [ ] Verify historical/philosophical references

**Acceptance Criteria:**
- All manual tests pass
- Content quality is high
- Visual design is consistent
- Works on all devices

**Estimated Time:** 2 hours

---

#### Task 4.2: Backend Deployment
**Subtasks:**
- [ ] Commit backend changes
- [ ] Push to main branch
- [ ] Verify GitHub Actions CI/CD passes
- [ ] Monitor Lambda deployment
- [ ] Check CloudWatch logs
- [ ] Verify API responses

**Acceptance Criteria:**
- Backend deploys successfully
- No errors in CloudWatch logs
- API returns editorial columns

**Estimated Time:** 30 minutes

---

#### Task 4.3: Frontend Deployment
**Subtasks:**
- [ ] Commit frontend changes
- [ ] Push to main branch
- [ ] Verify Amplify deployment
- [ ] Test on production URL
- [ ] Verify visual design
- [ ] Test on multiple devices

**Acceptance Criteria:**
- Frontend deploys successfully
- Editorial columns display correctly
- No visual regressions

**Estimated Time:** 30 minutes

---

#### Task 4.4: Documentation
**Subtasks:**
- [ ] Update `backend/README.md` with editorial column API
- [ ] Update `product.md` with editorial column feature
- [ ] Add example editorial columns to documentation
- [ ] Document prompt templates

**Acceptance Criteria:**
- Documentation is complete and accurate
- Examples are helpful
- API is well-documented

**Estimated Time:** 30 minutes

---

## Task Summary

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Backend Service | 2 tasks | 3.5 hours |
| Phase 2: API Integration | 4 tasks | 3.25 hours |
| Phase 3: Frontend | 4 tasks | 2.75 hours |
| Phase 4: Testing & Deployment | 4 tasks | 3.5 hours |
| **Total** | **14 tasks** | **13 hours** |

## Dependencies

- AWS Bedrock access (existing)
- DynamoDB (existing)
- Existing summary generation service (reference)

## Risks

1. **Bedrock API quality**: Column quality may vary
   - Mitigation: Prompt engineering and testing
   
2. **Performance impact**: Column generation may slow newspaper creation
   - Mitigation: Parallel generation, timeout limits
   
3. **Multi-language quality**: Japanese columns may be lower quality
   - Mitigation: Language-specific prompts, testing

## Success Metrics

- [ ] Editorial columns appear in 100% of new newspapers
- [ ] Column generation success rate > 95%
- [ ] Column generation time < 5 seconds
- [ ] No impact on newspaper generation performance
- [ ] User feedback is positive

## Next Steps

1. Start with Phase 1: Backend Service Implementation
2. Create editorial column service
3. Add unit tests
4. Proceed to API integration
