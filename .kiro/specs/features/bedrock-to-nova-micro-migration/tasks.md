# Implementation Plan: Bedrock Claude 3 Haiku to Nova Micro Migration

## Overview

This plan outlines the implementation tasks for migrating MyRSSPress from AWS Bedrock Claude 3 Haiku to AWS Bedrock Nova Micro. The migration will reduce AI inference costs while maintaining quality across five services: bedrockService, summaryGenerationService, importanceCalculator, articleFilterService, and editorialColumnService.

## Tasks

- [x] 1. Research Nova Micro model specifications
  - Research and document Nova Micro model ID from AWS Bedrock documentation
  - Verify model availability in ap-northeast-1 region
  - Document request format requirements (compare with Claude 3 Haiku)
  - Document response format (compare with Claude 3 Haiku)
  - Document pricing comparison with Claude 3 Haiku
  - Update design.md Appendix with findings
  - _Requirements: 2.1, 2.2, 3.6_

- [x] 2. Update configuration module
  - [x] 2.1 Add bedrockModelId to config.ts
    - Add `bedrockModelId` field with default value (Nova Micro model ID from research)
    - Add environment variable override support (`BEDROCK_MODEL_ID`)
    - Add JSDoc comments explaining configuration and rollback
    - _Requirements: 9.1, 9.2, 13.1, 13.2, 13.3, 13.4_

  - [x] 2.2 Write unit tests for configuration
    - Test default model ID is Nova Micro
    - Test environment variable override
    - Test rollback to Claude 3 Haiku via env var
    - _Requirements: 10.1, 10.6_

- [x] 3. Migrate bedrockService.ts
  - [x] 3.1 Replace hardcoded model ID with config.bedrockModelId
    - Update InvokeModelCommand to use `config.bedrockModelId`
    - Add request adapter function if Nova Micro format differs
    - Update response parsing if Nova Micro format differs
    - Maintain existing error handling and fallback logic
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.1, 3.6, 11.1, 11.2_

  - [x] 3.2 Write property test for feed suggestion minimum count
    - **Property 4: Feed Suggestion Minimum Count**
    - **Validates: Requirements 4.1**
    - Generate random themes, verify at least 15 feeds returned
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 4: Feed Suggestion Minimum Count`
    - _Requirements: 4.1, 10.1_

  - [x] 3.3 Write property test for feed URL format validation
    - **Property 5: Feed URL Format Validation**
    - **Validates: Requirements 4.3**
    - Generate random themes, verify all URLs match valid patterns
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 5: Feed URL Format Validation`
    - _Requirements: 4.3, 10.1_

  - [x] 3.4 Write unit tests for bedrockService
    - Test feed suggestion with valid Nova Micro response
    - Test feed suggestion with invalid URLs (fallback to defaults)
    - Test API error handling (fallback to defaults)
    - Test parsing error handling
    - _Requirements: 8.1, 10.1, 10.6_

- [x] 4. Migrate summaryGenerationService.ts
  - [x] 4.1 Replace hardcoded model ID with config.bedrockModelId
    - Update InvokeModelCommand to use `config.bedrockModelId`
    - Add request adapter function if needed
    - Update response parsing if needed
    - Maintain existing error handling (return null on error)
    - _Requirements: 1.2, 2.1, 2.2, 2.4, 3.2, 3.6, 11.1, 11.2_

  - [x] 4.2 Write property test for summary length constraint
    - **Property 7: Summary Length Constraint**
    - **Validates: Requirements 5.1**
    - Generate random article sets, verify summary length 100-200 chars
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 7: Summary Length Constraint`
    - _Requirements: 5.1, 10.2_

  - [x] 4.3 Write property test for summary line count constraint
    - **Property 8: Summary Line Count Constraint**
    - **Validates: Requirements 5.2**
    - Generate random article sets, verify summary has ≤3 lines
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 8: Summary Line Count Constraint`
    - _Requirements: 5.2, 10.2_

  - [x] 4.4 Write unit tests for summaryGenerationService
    - Test summary generation with valid Nova Micro response
    - Test API error handling (return null)
    - Test language detection and matching
    - Test parsing error handling
    - _Requirements: 5.3, 8.2, 10.2, 10.6_

- [x] 5. Migrate importanceCalculator.ts
  - [x] 5.1 Replace hardcoded model ID with config.bedrockModelId
    - Update InvokeModelCommand to use `config.bedrockModelId`
    - Add request adapter function if needed
    - Update response parsing if needed
    - Maintain existing fallback to rule-based calculation
    - _Requirements: 1.3, 2.1, 2.2, 2.5, 3.3, 3.6, 11.1, 11.2_

  - [x] 5.2 Write property test for importance score range
    - **Property 11: Importance Score Range**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - Generate random articles, verify all scores 0-100
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 11: Importance Score Range`
    - _Requirements: 6.1, 6.2, 6.3, 10.3_

  - [x] 5.3 Write property test for image bonus application
    - **Property 12: Image Bonus Application**
    - **Validates: Requirements 6.2**
    - Generate random articles with/without images, verify image bonus applied
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 12: Image Bonus Application`
    - _Requirements: 6.2, 10.3_

  - [x] 5.4 Write unit tests for importanceCalculator
    - Test importance calculation with valid Nova Micro response
    - Test API error handling (fallback to rule-based)
    - Test image bonus application
    - Test parsing error handling
    - _Requirements: 6.4, 8.3, 10.3, 10.6_

- [x] 6. Migrate articleFilterService.ts
  - [x] 6.1 Replace hardcoded model ID with config.bedrockModelId
    - Update InvokeModelCommand to use `config.bedrockModelId`
    - Add request adapter function if needed
    - Update response parsing if needed
    - Maintain existing error handling (return all articles on error)
    - _Requirements: 1.4, 2.1, 2.2, 2.6, 3.4, 3.6, 11.1, 11.2_

  - [x] 6.2 Write unit tests for articleFilterService
    - Test article filtering with valid Nova Micro response
    - Test API error handling (return all articles)
    - Test parsing error handling
    - Test validation error handling
    - _Requirements: 8.4, 10.4, 10.6_

- [x] 7. Migrate editorialColumnService.ts
  - [x] 7.1 Replace hardcoded model ID with config.bedrockModelId
    - Update InvokeModelCommand to use `config.bedrockModelId`
    - Add request adapter function if needed
    - Update response parsing if needed
    - Maintain existing error handling (return null on error)
    - _Requirements: 1.5, 2.1, 2.2, 2.7, 3.5, 3.6, 11.1, 11.2_

  - [x] 7.2 Write unit tests for editorialColumnService
    - Test editorial column generation with valid Nova Micro response
    - Test API error handling (return null)
    - Test parsing error handling
    - Test validation error handling
    - _Requirements: 8.5, 10.5, 10.6_

- [x] 8. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Verify test coverage remains above 60%
  - Ask the user if questions arise

- [x] 9. Implement additional property tests
  - [x] 9.1 Write property test for model ID configuration
    - **Property 1: Model ID Configuration**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 13.1, 13.2, 13.3**
    - Generate random service names, verify all use `config.bedrockModelId`
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 1: Model ID Configuration`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2_

  - [x] 9.2 Write property test for response parsing correctness
    - **Property 3: Response Parsing Correctness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
    - Generate random valid responses, verify parsing extracts correct data
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 3: Response Parsing Correctness`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 9.3 Write property test for cache behavior
    - **Property 18: Cache Behavior**
    - **Validates: Requirements 9.4, 11.4**
    - Generate random requests, make duplicate requests, verify cache hit on second request
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 18: Cache Behavior`
    - _Requirements: 9.4, 11.4_

  - [x] 9.4 Write property test for model rollback via environment variable
    - **Property 24: Model Rollback via Environment Variable**
    - **Validates: Requirements 13.1, 13.2, 13.3**
    - Generate random model IDs, set environment variable, verify correct model used
    - Tag: `Feature: bedrock-to-nova-micro-migration, Property 24: Model Rollback via Environment Variable`
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 10. Add error logging and monitoring
  - [x] 10.1 Add structured error logging to all services
    - Implement structured JSON error logging format
    - Log service name, model ID, error type, error message, context
    - Log to CloudWatch with appropriate severity levels
    - _Requirements: 8.6, 11.5_

  - [x] 10.2 Add monitoring metrics for cost tracking
    - Log API call counts to CloudWatch
    - Log response times to CloudWatch
    - Log token usage to CloudWatch (if available from Nova Micro)
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 10.3 Write unit tests for error logging
    - Test error logging format
    - Test CloudWatch integration
    - Test metrics logging
    - _Requirements: 8.6, 11.5, 12.1, 12.2, 12.3_

- [x] 11. Integration testing and validation
  - [x] 11.1 Test end-to-end newspaper generation with Nova Micro
    - Test complete newspaper generation flow
    - Verify all services use Nova Micro
    - Verify response quality meets requirements
    - Test with real Nova Micro API in staging environment
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3_

  - [x] 11.2 Test rollback capability
    - Set `BEDROCK_MODEL_ID` to Claude 3 Haiku model ID
    - Verify all services switch to Claude 3 Haiku
    - Test complete newspaper generation flow with Claude 3 Haiku
    - Switch back to Nova Micro and verify
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 11.3 Performance testing
    - Measure feed suggestion response time (target: <30s)
    - Measure summary generation response time (target: <10s)
    - Measure importance calculation response time (target: <5s)
    - Measure article filtering response time (target: <5s)
    - Measure editorial column generation response time (target: <15s)
    - Compare with Claude 3 Haiku baseline
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests with 100+ iterations
  - Verify test coverage above 60%
  - Verify all integration tests pass
  - Verify performance targets met
  - Ask the user if questions arise

- [x] 13. Update documentation
  - Update design.md with Nova Lite/Micro mixed configuration details
  - Update tech.md with Nova Lite/Micro configuration (already updated)
  - Update product.md with model assignment details (already updated)
  - Update backend/README.md with environment variable documentation
  - Update backend/.env.local.example with new environment variables
  - Document rollback procedure in design.md
  - Document cost comparison in design.md
  - Update environment variable documentation
  - _Requirements: 9.1, 9.2, 13.1, 13.2, 13.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- All services must maintain existing error handling and fallback behavior
- Rollback capability via environment variable is critical for production safety
- Performance targets must be met or exceeded compared to Claude 3 Haiku
