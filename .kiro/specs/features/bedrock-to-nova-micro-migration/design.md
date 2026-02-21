# Design Document: Bedrock Claude 3 Haiku to Nova Micro Migration

## Overview

This document outlines the design for migrating MyRSSPress from AWS Bedrock Claude 3 Haiku to AWS Bedrock Nova Micro. The migration aims to reduce AI inference costs while maintaining or improving the quality of AI-powered features.

### Current State

MyRSSPress currently uses Claude 3 Haiku (`anthropic.claude-3-haiku-20240307-v1:0`) across five services:

1. **bedrockService.ts** - Feed suggestions based on user themes
2. **summaryGenerationService.ts** - AI-generated newspaper summaries (100-200 chars, 3 lines)
3. **importanceCalculator.ts** - Article importance scoring for layout prioritization
4. **articleFilterService.ts** - Theme-based article relevance filtering
5. **editorialColumnService.ts** - Editorial column generation in newspaper style

All services use the same Bedrock client configuration with `BedrockRuntimeClient` and invoke models using `InvokeModelCommand` with the Anthropic Messages API format.

### Target State

After migration, services will use a mixed configuration of Nova Lite and Nova Micro models based on their specific requirements:

- **Nova Lite** (`amazon.nova-lite-v1:0`): Used for services requiring higher quality output
  - feedSuggestionService (formerly bedrockService) - RSS feed suggestions
  - editorialColumnService - Editorial column generation
  
- **Nova Micro** (`amazon.nova-micro-v1:0`): Used for services requiring faster, cost-effective processing
  - summaryGenerationService - AI-generated newspaper summaries
  - importanceCalculator - Article importance scoring
  - articleFilterService - Theme-based article filtering

### Migration Goals

1. **Cost Reduction**: Reduce AI inference costs by switching to Nova Micro
2. **Quality Maintenance**: Maintain or improve response quality across all services
3. **API Compatibility**: Ensure minimal code changes by maintaining request/response formats
4. **Rollback Capability**: Support quick rollback to Claude 3 Haiku via environment variables
5. **Performance**: Maintain or improve response times

### Key Design Decisions

1. **Centralized Configuration**: Model ID will be defined in `config.ts` and overridable via environment variable
2. **Request Format Adaptation**: If Nova Micro requires different request format, adapt at the service layer
3. **Response Parsing**: Update parsing logic if Nova Micro response format differs
4. **Fallback Behavior**: Maintain existing fallback mechanisms for API failures
5. **Testing Strategy**: Comprehensive unit tests and property-based tests for all services

## Architecture

### Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Lambda Handler                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  bedrockSvc  │  │  summarySvc  │  │ importanceSvc│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  filterSvc   │  │ editorialSvc │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BedrockRuntimeClient                           │
│         (Claude 3 Haiku: anthropic.claude-3-haiku...)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS Bedrock API                          │
└─────────────────────────────────────────────────────────────┘
```

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Lambda Handler                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  bedrockSvc  │  │  summarySvc  │  │ importanceSvc│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  filterSvc   │  │ editorialSvc │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              BedrockRuntimeClient                           │
│         (Nova Micro: amazon.nova-micro-v1:0)                │
│         (Configurable via environment variable)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS Bedrock API                          │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Changes

1. **Configuration Layer**: Add `bedrockModelIdLite` and `bedrockModelIdMicro` to `config.ts` with environment variable overrides
2. **Service Naming**: Rename `bedrockService` to `feedSuggestionService` for better abstraction
3. **Request Adapter**: If Nova models use different request format, add adapter function
4. **Response Parser**: If Nova models use different response format, update parsing logic
5. **Monitoring**: Add model-specific logging for cost tracking and performance monitoring

## Components and Interfaces

### 1. Configuration Module (`config.ts`)

**Purpose**: Centralize Bedrock model configuration with separate model IDs for different service tiers

**New Configuration**:

```typescript
export const config = {
  // Existing configuration...
  bedrockRegion: process.env.BEDROCK_REGION || 'ap-northeast-1',
  
  // NEW: Bedrock model ID configuration (mixed Lite/Micro)
  bedrockModelIdLite: process.env.BEDROCK_MODEL_ID_LITE || 'amazon.nova-lite-v1:0',
  bedrockModelIdMicro: process.env.BEDROCK_MODEL_ID_MICRO || 'amazon.nova-micro-v1:0',
  
  // Existing configuration...
  useMockBedrock: process.env.USE_BEDROCK_MOCK === 'true',
  enableCache: process.env.ENABLE_BEDROCK_CACHE !== 'false',
};
```

**Environment Variables**:
- `BEDROCK_MODEL_ID_LITE`: Override model ID for Lite tier services (for rollback or testing)
  - Default: `amazon.nova-lite-v1:0` (Nova Lite)
  - Rollback: `anthropic.claude-3-haiku-20240307-v1:0` (Claude 3 Haiku)
  - Used by: feedSuggestionService, editorialColumnService
  
- `BEDROCK_MODEL_ID_MICRO`: Override model ID for Micro tier services (for rollback or testing)
  - Default: `amazon.nova-micro-v1:0` (Nova Micro)
  - Rollback: `anthropic.claude-3-haiku-20240307-v1:0` (Claude 3 Haiku)
  - Used by: summaryGenerationService, importanceCalculator, articleFilterService

### 2. Feed Suggestion Service (`feedSuggestionService.ts`, formerly `bedrockService.ts`)

**Service Renaming**: Renamed from `bedrockService` to `feedSuggestionService` for better abstraction and provider independence.

**Current Implementation**:
- Hardcoded model ID: `anthropic.claude-3-haiku-20240307-v1:0`
- Request format: Anthropic Messages API
- Response parsing: Extract JSON from `content[0].text`

**Changes Required**:

1. **Model ID**: Replace hardcoded model ID with `config.bedrockModelIdLite` (uses Nova Lite)
2. **Request Format**: Investigate Nova Lite request format
   - If same as Anthropic: No changes needed
   - If different: Add request adapter function
3. **Response Parsing**: Investigate Nova Lite response format
   - If same as Anthropic: No changes needed
   - If different: Update parsing logic

**Updated Code Structure**:

```typescript
// Use configurable model ID (Lite tier)
const command = new InvokeModelCommand({
  modelId: config.bedrockModelIdLite, // Changed from hardcoded, uses Lite
  contentType: 'application/json',
  accept: 'application/json',
  body: JSON.stringify(buildRequestBody(prompt)),
});
```

### 3. Summary Generation Service (`summaryGenerationService.ts`)

**Current Implementation**:
- Hardcoded model ID: `anthropic.claude-3-haiku-20240307-v1:0`
- Generates 100-200 character summaries in 3 lines
- Language detection based on newspaper languages

**Changes Required**:
- Model ID: Replace with `config.bedrockModelIdMicro` (uses Nova Micro)
- Request format and response parsing: Same investigation as feedSuggestionService

### 4. Importance Calculator (`importanceCalculator.ts`)

**Current Implementation**:
- Hardcoded model ID: `anthropic.claude-3-haiku-20240307-v1:0`
- Calculates importance scores (0-100) for articles
- Fallback to rule-based calculation on error

**Changes Required**:
- Model ID: Replace with `config.bedrockModelIdMicro` (uses Nova Micro)
- Request format and response parsing: Same investigation as feedSuggestionService

### 5. Article Filter Service (`articleFilterService.ts`)

**Current Implementation**:
- Hardcoded model ID: `anthropic.claude-3-haiku-20240307-v1:0`
- Filters articles by theme relevance
- Returns all articles on error

**Changes Required**:
- Model ID: Replace with `config.bedrockModelIdMicro` (uses Nova Micro)
- Request format and response parsing: Same investigation as feedSuggestionService

### 6. Editorial Column Service (`editorialColumnService.ts`)

**Current Implementation**:
- Hardcoded model ID: `anthropic.claude-3-haiku-20240307-v1:0`
- Generates editorial columns (100-150 words EN, 200-250 chars JP)
- Parses title and column from response

**Changes Required**:
- Model ID: Replace with `config.bedrockModelIdLite` (uses Nova Lite)
- Request format and response parsing: Same investigation as feedSuggestionService

## Data Models

### Request Format

**Current (Anthropic Messages API)**:

```typescript
{
  anthropic_version: 'bedrock-2023-05-31',
  max_tokens: number,
  messages: [
    {
      role: 'user',
      content: string
    }
  ],
  temperature?: number
}
```

**Nova Micro Format** (To be determined):
- Research needed to determine if Nova Micro uses the same format
- If different, document the new format here
- Create adapter function if needed

### Response Format

**Current (Anthropic Messages API)**:

```typescript
{
  content: [
    {
      text: string
    }
  ]
}
```

**Nova Micro Format** (To be determined):
- Research needed to determine if Nova Micro uses the same format
- If different, document the new format here
- Update parsing logic if needed

### Configuration Model

```typescript
interface BedrockConfig {
  bedrockRegion: string;
  bedrockModelIdLite: string;  // NEW: For Lite tier services
  bedrockModelIdMicro: string; // NEW: For Micro tier services
  useMockBedrock: boolean;
  enableCache: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Model ID Configuration

*For any* service invocation, the system should use the appropriate model ID from `config.bedrockModelIdLite` or `config.bedrockModelIdMicro` based on the service tier, which can be overridden by the `BEDROCK_MODEL_ID_LITE` or `BEDROCK_MODEL_ID_MICRO` environment variables.

- **Lite tier services** (feedSuggestionService, editorialColumnService): Use `config.bedrockModelIdLite`
- **Micro tier services** (summaryGenerationService, importanceCalculator, articleFilterService): Use `config.bedrockModelIdMicro`

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 13.1, 13.2, 13.3**

### Property 2: Request Format Compatibility

*For any* prompt and service, when invoking the Bedrock API, the request structure should be compatible with the target model (Nova Micro or Claude 3 Haiku based on configuration).

**Validates: Requirements 2.1, 2.2**

### Property 3: Response Parsing Correctness

*For any* Bedrock API response, the system should correctly parse the response according to the model's response format and extract the expected data (feeds, summaries, scores, etc.).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 4: Feed Suggestion Minimum Count

*For any* theme input, the feed suggestion service should return at least 15 valid RSS feed URLs (including fallback to default feeds if necessary).

**Validates: Requirements 4.1**

### Property 5: Feed URL Format Validation

*For any* feed suggestion response, all returned feed URLs should match valid RSS feed URL patterns (http/https protocol, valid domain, common feed paths).

**Validates: Requirements 4.3**

### Property 6: Feed Suggestion Fallback

*For any* theme input, when Nova Micro returns invalid or no URLs, the system should fall back to default feeds and return at least 1 feed.

**Validates: Requirements 4.5, 8.1**

### Property 7: Summary Length Constraint

*For any* set of articles and theme, the generated summary should be between 100-200 characters in length.

**Validates: Requirements 5.1**

### Property 8: Summary Line Count Constraint

*For any* set of articles and theme, the generated summary should contain 3 lines or fewer (counting newline characters).

**Validates: Requirements 5.2**

### Property 9: Summary Language Matching

*For any* set of articles with detected languages, the generated summary should be in the correct language (Japanese if only JP detected, English otherwise).

**Validates: Requirements 5.3**

### Property 10: Summary Generation Fallback

*For any* set of articles, when Nova Micro API fails, the summary generation service should return null without throwing an error.

**Validates: Requirements 8.2**

### Property 11: Importance Score Range

*For any* article, the calculated importance score should be between 0 and 100 (inclusive).

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 12: Image Bonus Application

*For any* two identical articles where one has an image and one doesn't, the article with an image should receive a higher importance score (approximately +10 to +20 points higher).

**Validates: Requirements 6.2**

### Property 13: Importance Calculation Fallback

*For any* set of articles, when Nova Micro API fails, the importance calculator should fall back to rule-based calculation and return valid scores (0-100) for all articles.

**Validates: Requirements 6.4, 8.3**

### Property 14: Article Filter Fallback

*For any* set of articles and theme, when Nova Micro API fails, the article filter service should return all articles unfiltered.

**Validates: Requirements 8.4**

### Property 15: Editorial Column Fallback

*For any* set of articles and theme, when Nova Micro API fails, the editorial column service should return null without throwing an error.

**Validates: Requirements 8.5**

### Property 16: Error Logging

*For any* Nova Micro API error, the system should log the error to CloudWatch with relevant context (service name, error message, timestamp).

**Validates: Requirements 8.6**

### Property 17: Mock Mode Behavior

*For any* service invocation, when `useMockBedrock` is true, the system should not make actual API calls to Bedrock and should return mock data instead.

**Validates: Requirements 9.3**

### Property 18: Cache Behavior

*For any* repeated request with the same parameters in local development mode, when cache is enabled, the system should return cached results without making additional API calls.

**Validates: Requirements 9.4, 11.4**

### Property 19: API Endpoint Stability

*For any* API endpoint, the endpoint path and HTTP method should remain unchanged after migration.

**Validates: Requirements 11.1**

### Property 20: Request/Response Format Stability

*For any* API endpoint, the request and response JSON schemas should remain unchanged after migration (internal Bedrock format may change, but external API contract stays the same).

**Validates: Requirements 11.2**

### Property 21: Error Response Consistency

*For any* error condition, the error response format and HTTP status codes should remain consistent with pre-migration behavior.

**Validates: Requirements 11.3**

### Property 22: Logging Format Consistency

*For any* log entry, the log format (JSON structure, field names, severity levels) should remain consistent with pre-migration behavior.

**Validates: Requirements 11.5**

### Property 23: Monitoring Metrics

*For any* Bedrock API call, the system should log call count, response time, and token usage (if available) to CloudWatch for cost monitoring.

**Validates: Requirements 12.1, 12.2, 12.3**

### Property 24: Model Rollback via Environment Variable

*For any* service, when `BEDROCK_MODEL_ID` environment variable is set to Claude 3 Haiku model ID, the system should use Claude 3 Haiku; when set to Nova Micro model ID, the system should use Nova Micro.

**Validates: Requirements 13.1, 13.2, 13.3**

## Error Handling

### Error Categories

1. **API Errors**: Bedrock API failures (timeout, throttling, service errors)
2. **Parsing Errors**: Response parsing failures (malformed JSON, unexpected format)
3. **Validation Errors**: Invalid responses (empty results, out-of-range values)
4. **Configuration Errors**: Invalid model ID or configuration

### Error Handling Strategy

#### 1. Feed Suggestion Service

**API Error**:
- Log error with context
- Try popular feeds from usage tracking
- Try DynamoDB category feeds
- Fall back to 1 random default feed
- Never throw error to user

**Parsing Error**:
- Log error with response sample
- Try manual extraction with regex
- Fall back to default feeds
- Never throw error to user

**Validation Error**:
- Log invalid URLs
- Filter out invalid feeds
- Supplement with default feeds if needed
- Ensure minimum 1 feed returned

#### 2. Summary Generation Service

**API Error**:
- Log error with context
- Return null (summary is optional)
- Newspaper generation continues without summary

**Parsing Error**:
- Log error with response sample
- Return null
- No retry (summary is optional)

**Validation Error**:
- Check length constraints
- If out of range, log warning but accept
- Return summary anyway (better than nothing)

#### 3. Importance Calculator

**API Error**:
- Log error with context
- Fall back to rule-based calculation
- Use title length + image bonus + random variation
- Always return valid scores (0-100)

**Parsing Error**:
- Log error with response sample
- Fall back to rule-based calculation
- Never throw error

**Validation Error**:
- Clamp scores to 0-100 range
- Log warning if out of range
- Continue with clamped values

#### 4. Article Filter Service

**API Error**:
- Log error with context
- Return all articles unfiltered
- Better to show all than show nothing

**Parsing Error**:
- Log error with response sample
- Return all articles unfiltered
- Never throw error

**Validation Error**:
- Validate indices are within array bounds
- Filter out invalid indices
- If too few articles after filtering, return all

#### 5. Editorial Column Service

**API Error**:
- Log error with context
- Return null (column is optional)
- Newspaper generation continues without column

**Parsing Error**:
- Log error with response sample
- Try fallback parsing strategies
- Return null if all strategies fail

**Validation Error**:
- Check title and column are non-empty
- If empty, return null
- Log warning

### Error Logging Format

All errors should be logged in structured JSON format:

```typescript
{
  timestamp: string,
  service: string,
  modelId: string,
  errorType: 'API_ERROR' | 'PARSE_ERROR' | 'VALIDATION_ERROR',
  errorMessage: string,
  context: {
    theme?: string,
    articleCount?: number,
    // ... service-specific context
  },
  stack?: string
}
```

### Monitoring and Alerting

- **CloudWatch Metrics**: Track error rates per service
- **CloudWatch Alarms**: Alert if error rate exceeds threshold (e.g., >10% in 5 minutes)
- **Cost Monitoring**: Track token usage and API call counts for cost analysis

## Testing Strategy

### Dual Testing Approach

This migration requires both unit tests and property-based tests:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both are complementary and necessary for comprehensive coverage.

### Unit Testing

**Focus Areas**:
- Specific model ID configuration scenarios
- Error handling for each service
- Fallback behavior verification
- Mock mode functionality
- Cache behavior in local development

**Test Cases**:

1. **Configuration Tests**:
   - Default model ID is Nova Micro
   - Environment variable overrides default
   - Rollback to Claude 3 Haiku via env var

2. **Service-Specific Tests**:
   - Feed suggestion with valid response
   - Feed suggestion with invalid URLs (fallback)
   - Summary generation with valid response
   - Summary generation with API error (null return)
   - Importance calculation with valid response
   - Importance calculation with API error (fallback)
   - Article filter with valid response
   - Article filter with API error (return all)
   - Editorial column with valid response
   - Editorial column with API error (null return)

3. **Error Handling Tests**:
   - API timeout handling
   - Malformed response handling
   - Empty response handling
   - Invalid model ID handling

4. **Integration Tests**:
   - End-to-end newspaper generation with Nova Micro
   - Rollback scenario (switch to Claude 3 Haiku)
   - Mock mode in local development

### Property-Based Testing

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Tag Format**: `Feature: bedrock-to-nova-micro-migration, Property {number}: {property_text}`

**Property Tests**:

1. **Property 1: Model ID Configuration**
   - Generate random service names
   - Verify all use `config.bedrockModelId`
   - Tag: `Feature: bedrock-to-nova-micro-migration, Property 1: Model ID Configuration`

2. **Property 3: Response Parsing Correctness**
   - Generate random valid responses
   - Verify parsing extracts correct data
   - Tag: `Feature: bedrock-to-nova-micro-migration, Property 3: Response Parsing Correctness`

3. **Property 4: Feed Suggestion Minimum Count**
   - Generate random themes
   - Verify at least 15 feeds returned
   - Tag: `Feature: bedrock-to-nova-micro-migration, Property 4: Feed Suggestion Minimum Count`

4. **Property 5: Feed URL Format Validation**
   - Generate random themes
   - Verify all URLs match valid patterns
   - Tag: `Feature: bedrock-to-nova-micro-migration, Property 5: Feed URL Format Validation`

5. **Property 7: Summary Length Constraint**
   - Generate random article sets
   - Verify summary length 100-200 chars
   - Tag: `Feature: bedrock-to-nova-micro-migration, Property 7: Summary Length Constraint`

6. **Property 8: Summary Line Count Constraint**
   - Generate random article sets
   - Verify summary has ≤3 lines
   - Tag: `Feature: bedrock-to-nova-micro-migration, Property 8: Summary Line Count Constraint`

7. **Property 11: Importance Score Range**
   - Generate random articles
   - Verify all scores 0-100
   - Tag: `Feature: bedrock-to-nova-micro-migration, Property 11: Importance Score Range`

8. **Property 12: Image Bonus Application**
   - Generate random articles with/without images
   - Verify image bonus applied
   - Tag: `Feature: bedrock-to-nova-micro-migration, Property 12: Image Bonus Application`

9. **Property 18: Cache Behavior**
   - Generate random requests
   - Make duplicate requests
   - Verify cache hit on second request
   - Tag: `Feature: bedrock-to-nova-micro-migration, Property 18: Cache Behavior`

10. **Property 24: Model Rollback via Environment Variable**
    - Generate random model IDs
    - Set environment variable
    - Verify correct model used
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 24: Model Rollback via Environment Variable`

### Test Coverage Target

- Maintain overall test coverage above 60%
- Aim for 80%+ coverage on modified services
- 100% coverage on new configuration code

### Testing Tools

- **Unit Tests**: Jest or Vitest
- **Property Tests**: fast-check
- **Mocking**: AWS SDK mocking for Bedrock client
- **Coverage**: Istanbul/nyc

### Test Execution

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run property tests only
npm run test:property

# Run specific service tests
npm test bedrockService
```

## Implementation Plan

### Phase 1: Research and Preparation

1. **Research Nova Micro**:
   - Determine correct model ID
   - Document request format
   - Document response format
   - Compare with Claude 3 Haiku

2. **Update Documentation**:
   - Document Nova Micro model ID in design
   - Document any format differences
   - Update architecture diagrams

### Phase 2: Configuration Changes

1. **Update config.ts**:
   - Add `bedrockModelId` configuration
   - Add environment variable support
   - Add JSDoc comments

2. **Update Tests**:
   - Add configuration tests
   - Test environment variable override
   - Test rollback scenario

### Phase 3: Service Migration

1. **Update bedrockService.ts**:
   - Replace hardcoded model ID
   - Add request adapter if needed
   - Update response parsing if needed
   - Update tests

2. **Update summaryGenerationService.ts**:
   - Same changes as bedrockService.ts
   - Update tests

3. **Update importanceCalculator.ts**:
   - Same changes as bedrockService.ts
   - Update tests

4. **Update articleFilterService.ts**:
   - Same changes as bedrockService.ts
   - Update tests

5. **Update editorialColumnService.ts**:
   - Same changes as bedrockService.ts
   - Update tests

### Phase 4: Testing and Validation

1. **Unit Testing**:
   - Run all unit tests
   - Verify 60%+ coverage
   - Fix any failures

2. **Property Testing**:
   - Implement property tests
   - Run with 100+ iterations
   - Fix any failures

3. **Integration Testing**:
   - Test end-to-end newspaper generation
   - Test with real Nova Micro API
   - Verify response quality

4. **Performance Testing**:
   - Measure response times
   - Compare with Claude 3 Haiku baseline
   - Verify performance targets met

### Phase 5: Deployment and Monitoring

1. **Staging Deployment**:
   - Deploy to staging environment
   - Run smoke tests
   - Monitor for errors

2. **Production Deployment**:
   - Deploy to production with feature flag
   - Gradual rollout (10% → 50% → 100%)
   - Monitor error rates and performance

3. **Cost Monitoring**:
   - Track API call counts
   - Track token usage
   - Calculate cost savings

4. **Rollback Plan**:
   - Document rollback procedure
   - Test rollback in staging
   - Keep Claude 3 Haiku as fallback option

## Migration Risks and Mitigation

### Risk 1: Response Quality Degradation

**Risk**: Nova Micro may produce lower quality responses than Claude 3 Haiku

**Mitigation**:
- Conduct quality comparison testing before full rollout
- Implement A/B testing in production
- Keep rollback option via environment variable
- Monitor user feedback and error rates

### Risk 2: API Format Incompatibility

**Risk**: Nova Micro may use different request/response format

**Mitigation**:
- Research Nova Micro API format thoroughly
- Implement adapter functions if needed
- Test with real API before deployment
- Maintain backward compatibility

### Risk 3: Performance Degradation

**Risk**: Nova Micro may be slower than Claude 3 Haiku

**Mitigation**:
- Measure baseline performance with Claude 3 Haiku
- Test Nova Micro performance in staging
- Set performance targets and monitor
- Rollback if targets not met

### Risk 4: Cost Increase

**Risk**: Nova Micro may be more expensive than expected

**Mitigation**:
- Calculate expected costs before migration
- Monitor actual costs in production
- Set cost alerts in CloudWatch
- Rollback if costs exceed budget

### Risk 5: Deployment Issues

**Risk**: Deployment may cause service disruption

**Mitigation**:
- Deploy to staging first
- Use gradual rollout in production
- Monitor error rates closely
- Have rollback plan ready

## Rollback Procedure

If issues occur after migration to Nova Micro, follow this procedure to rollback to Claude 3 Haiku:

### Quick Rollback (Environment Variable)

**Steps**:
1. Set environment variable in Lambda configuration:
   ```bash
   BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
   ```
2. Restart Lambda functions:
   - Option A: Update Lambda environment variables in AWS Console
   - Option B: Redeploy via GitHub Actions
   - Option C: Wait for cold start (Lambda will pick up new env var)
3. Verify rollback:
   - Check CloudWatch logs for model ID being used
   - Test feed suggestions, summaries, and other AI features
   - Monitor error rates and response times
4. Monitor for stability:
   - Watch CloudWatch metrics for 30 minutes
   - Verify no increase in error rates
   - Confirm response quality is acceptable

**Rollback Time**: 5-10 minutes (immediate if using AWS Console)

### Full Rollback (Code Revert)

If environment variable rollback is insufficient:

**Steps**:
1. Revert Git commit to pre-migration state:
   ```bash
   git revert <migration-commit-hash>
   git push origin main
   ```
2. GitHub Actions will automatically deploy reverted code
3. Verify deployment in CloudWatch logs
4. Monitor for stability

**Rollback Time**: 10-15 minutes (depends on CI/CD pipeline)

### Verification Checklist

After rollback, verify:
- ✅ Feed suggestions return valid RSS feeds
- ✅ AI summaries generate correctly
- ✅ Article importance scores are reasonable
- ✅ Article filtering works as expected
- ✅ Editorial columns generate correctly
- ✅ Error rates return to baseline
- ✅ Response times meet performance targets
- ✅ CloudWatch logs show Claude 3 Haiku model ID

## Cost Comparison

### Pricing Details

**Claude 3 Haiku (Previous)**:
- **Input**: $0.25 per 1M tokens
- **Output**: $1.25 per 1M tokens
- **Source**: [Anthropic Pricing](https://www.anthropic.com/pricing)

**Nova Micro (Current)**:
- **Input**: $0.035 per 1M tokens
- **Output**: $0.14 per 1M tokens
- **Source**: [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)

### Cost Reduction

- **Input tokens**: 86% cheaper ($0.25 → $0.035)
- **Output tokens**: 89% cheaper ($1.25 → $0.14)
- **Overall**: ~87-89% cost reduction

### Example Cost Calculation

**Scenario**: 1M input tokens + 1M output tokens

- **Claude 3 Haiku**: $0.25 + $1.25 = **$1.50**
- **Nova Micro**: $0.035 + $0.14 = **$0.175**
- **Savings**: $1.325 per 1M token pairs (88% reduction)

### Monthly Savings Estimate

**Assumptions**: 100M input tokens + 50M output tokens per month

- **Claude 3 Haiku**: (100 × $0.25) + (50 × $1.25) = $25 + $62.50 = **$87.50/month**
- **Nova Micro**: (100 × $0.035) + (50 × $0.14) = $3.50 + $7.00 = **$10.50/month**
- **Monthly Savings**: **$77.00/month** (88% reduction)

### Cost Monitoring

To track actual cost savings:

1. **CloudWatch Metrics**: Monitor token usage per service
2. **AWS Cost Explorer**: Compare Bedrock costs month-over-month
3. **Custom Dashboards**: Create dashboards showing:
   - API call counts per service
   - Token usage (input/output) per service
   - Estimated costs per service
   - Cost trends over time

4. **Alerts**: Set up CloudWatch alarms for:
   - Daily cost exceeds threshold
   - Token usage spike (>50% increase)
   - API call rate spike (>100% increase)

## Success Criteria

### Functional Success

- ✅ All services use Nova Micro model ID
- ✅ All existing functionality works correctly
- ✅ All tests pass (unit and property tests)
- ✅ Test coverage remains above 60%
- ✅ Error handling works as expected
- ✅ Fallback mechanisms work correctly

### Quality Success

- ✅ Feed suggestions remain relevant and valid
- ✅ Summaries remain concise and accurate
- ✅ Importance scores remain reasonable
- ✅ Article filtering remains effective
- ✅ Editorial columns remain high quality

### Performance Success

- ✅ Feed suggestions complete within 30 seconds
- ✅ Summary generation completes within 10 seconds
- ✅ Importance calculation completes within 5 seconds
- ✅ Article filtering completes within 5 seconds
- ✅ Editorial column generation completes within 15 seconds

### Cost Success

- ✅ AI inference costs reduced by target percentage
- ✅ Cost monitoring in place
- ✅ Cost alerts configured

### Operational Success

- ✅ Rollback capability verified
- ✅ Monitoring and alerting in place
- ✅ Documentation updated
- ✅ Team trained on new configuration

## Appendix

### Nova Micro Model ID Research

**Status**: ✅ Completed (2025-01-30)

**Model ID**: `amazon.nova-micro-v1:0`

**Region Availability**: 
- ✅ **ap-northeast-1 (Tokyo)** - Available
- Also available in: ap-southeast-2, eu-west-2, us-east-1, us-gov-west-1, ap-east-2, ap-northeast-2, ap-south-1, ap-southeast-1, ap-southeast-3, ap-southeast-5, ap-southeast-7, eu-central-1, eu-north-1, eu-south-1, eu-south-2, eu-west-1, eu-west-3, il-central-1, me-central-1, us-east-2, us-west-2

**Model Characteristics**:
- **Type**: Text-only model (no image/video support)
- **Context Length**: 128K tokens
- **Optimized For**: Speed and cost
- **Use Cases**: Text summarization, translation, content classification, interactive chat, brainstorming, simple mathematical reasoning, coding
- **Performance**: 210 tokens per second processing speed

**Source**: [AWS Bedrock Model IDs Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html)

### Request Format Comparison

**Claude 3 Haiku (Current - Anthropic Messages API)**:
```json
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 8192,
  "messages": [
    {
      "role": "user",
      "content": "prompt text"
    }
  ],
  "temperature": 0.7
}
```

**Nova Micro (Target - Messages API v1)**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "text": "prompt text"
        }
      ]
    }
  ],
  "inferenceConfig": {
    "maxTokens": 5000,
    "temperature": 0.7,
    "topP": 0.9,
    "topK": 50,
    "stopSequences": ["string"]
  },
  "system": [
    {
      "text": "system prompt (optional)"
    }
  ]
}
```

**Key Differences**:
1. **No `anthropic_version` field** - Nova Micro uses a simpler schema
2. **Content structure** - Nova Micro wraps content in an array of objects with `text` key
3. **Inference config** - Nova Micro uses `inferenceConfig` object instead of top-level parameters
4. **Parameter names** - `max_tokens` → `maxTokens`, `top_p` → `topP`, `top_k` → `topK`
5. **System prompts** - Nova Micro uses separate `system` array instead of system message in messages array
6. **Max tokens limit** - Nova Micro supports up to 5,000 tokens (vs Claude 3 Haiku's 8,192)

**Compatibility Assessment**: ⚠️ **Requires adapter function** - Request format differs significantly

### Response Format Comparison

**Claude 3 Haiku (Current)**:
```json
{
  "content": [
    {
      "text": "response text"
    }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 20
  }
}
```

**Nova Micro (Target)**:
```json
{
  "output": {
    "message": {
      "role": "assistant",
      "content": [
        {
          "text": "response text"
        }
      ]
    }
  },
  "stopReason": "end_turn",
  "usage": {
    "inputTokens": 10,
    "outputTokens": 20
  }
}
```

**Key Differences**:
1. **Response structure** - Nova Micro wraps response in `output.message` object
2. **Field names** - `stop_reason` → `stopReason`, `input_tokens` → `inputTokens`, `output_tokens` → `outputTokens`
3. **Content access path** - `content[0].text` → `output.message.content[0].text`

**Compatibility Assessment**: ⚠️ **Requires parsing update** - Response structure differs

### Pricing Comparison

**Claude 3 Haiku (Current)**:
- **Input**: $0.25 per 1M tokens
- **Output**: $1.25 per 1M tokens
- **Source**: [Anthropic Pricing](https://www.anthropic.com/pricing)

**Nova Micro (Target)**:
- **Input**: $0.035 per 1M tokens (~$0.04 rounded)
- **Output**: $0.14 per 1M tokens
- **Source**: [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) and [AWS Blog](https://aws.amazon.com/blogs/machine-learning/prompting-for-the-best-price-performance/)

**Cost Reduction**:
- **Input tokens**: 86% cheaper ($0.25 → $0.035)
- **Output tokens**: 89% cheaper ($1.25 → $0.14)
- **Overall**: ~87-89% cost reduction

**Example Cost Calculation** (1M input tokens + 1M output tokens):
- **Claude 3 Haiku**: $0.25 + $1.25 = **$1.50**
- **Nova Micro**: $0.035 + $0.14 = **$0.175**
- **Savings**: $1.325 per 1M token pairs (88% reduction)

**Monthly Savings Estimate** (assuming 100M input + 50M output tokens/month):
- **Claude 3 Haiku**: (100 × $0.25) + (50 × $1.25) = $25 + $62.50 = **$87.50/month**
- **Nova Micro**: (100 × $0.035) + (50 × $0.14) = $3.50 + $7.00 = **$10.50/month**
- **Monthly Savings**: **$77.00/month** (88% reduction)

### Environment Variables

| Variable | Default | Description | Rollback Value |
|----------|---------|-------------|----------------|
| `BEDROCK_MODEL_ID` | `amazon.nova-micro-v1:0` | Bedrock model ID for all AI services | `anthropic.claude-3-haiku-20240307-v1:0` |
| `BEDROCK_REGION` | `ap-northeast-1` | AWS region for Bedrock API calls | (no change) |
| `USE_BEDROCK_MOCK` | `false` | Enable mock mode (no API calls, returns mock data) | (no change) |
| `ENABLE_BEDROCK_CACHE` | `true` | Enable caching in local development mode | (no change) |

**Usage Examples**:

```bash
# Production (default - uses Nova Micro)
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0

# Rollback to Claude 3 Haiku
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Local development with mock mode
USE_BEDROCK_MOCK=true
ENABLE_BEDROCK_CACHE=true

# Local development with real API
USE_BEDROCK_MOCK=false
ENABLE_BEDROCK_CACHE=true
```

**Configuration in Lambda**:
1. AWS Console → Lambda → Configuration → Environment variables
2. Add/Update `BEDROCK_MODEL_ID` variable
3. Save changes (Lambda will restart automatically)

**Configuration in Local Development**:
1. Create/update `backend/.env.local` file
2. Add environment variables
3. Restart local dev server (`npm run dev`)

### Implementation Notes

**Request Adapter Required**: Yes
- Convert Anthropic Messages API format to Nova Micro Messages API v1 format
- Map parameter names (snake_case → camelCase)
- Restructure content array
- Move system prompts to separate field

**Response Parser Update Required**: Yes
- Update parsing path from `content[0].text` to `output.message.content[0].text`
- Update field name references (snake_case → camelCase)

**API Compatibility**: Both models use AWS Bedrock `InvokeModelCommand`, so no changes needed at the client level

**Performance Considerations**:
- Nova Micro processes at 210 tokens/second (faster than Claude 3 Haiku)
- Max tokens limit is 5,000 (vs 8,192 for Claude 3 Haiku) - ensure prompts stay within limit
- Timeout period: 60 minutes (same as Claude 3 Haiku)
