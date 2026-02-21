# Requirements Document

## Introduction

This document defines the requirements for migrating MyRSSPress from AWS Bedrock Claude 3 Haiku to AWS Bedrock Nova Micro. The migration aims to reduce AI inference costs while maintaining or improving the quality of AI-powered features including feed suggestions, article importance calculation, AI summaries, article filtering, and editorial column generation.

## Glossary

- **Bedrock**: AWS managed service for foundation models
- **Claude 3 Haiku**: Anthropic's fast and cost-effective AI model (current)
- **Nova Micro**: Amazon's new cost-effective AI model (target)
- **Model_ID**: Unique identifier for Bedrock models
- **Feed_Suggestion_Service**: Service that suggests RSS feeds based on user themes
- **Summary_Generation_Service**: Service that generates AI summaries for newspapers
- **Importance_Calculator**: Service that calculates article importance scores
- **Article_Filter_Service**: Service that filters articles by theme relevance
- **Editorial_Column_Service**: Service that generates editorial columns
- **Inference_Cost**: Cost per API call to Bedrock models
- **Response_Quality**: Accuracy and relevance of AI-generated content
- **API_Compatibility**: Compatibility of request/response formats between models

## Requirements

### Requirement 1: Model Migration

**User Story:** As a system administrator, I want to migrate from Claude 3 Haiku to Nova Micro, so that I can reduce AI inference costs

#### Acceptance Criteria

1. THE Feed_Suggestion_Service SHALL use Nova Micro model ID instead of Claude 3 Haiku
2. THE Summary_Generation_Service SHALL use Nova Micro model ID instead of Claude 3 Haiku
3. THE Importance_Calculator SHALL use Nova Micro model ID instead of Claude 3 Haiku
4. THE Article_Filter_Service SHALL use Nova Micro model ID instead of Claude 3 Haiku
5. THE Editorial_Column_Service SHALL use Nova Micro model ID instead of Claude 3 Haiku

### Requirement 2: API Request Format Compatibility

**User Story:** As a developer, I want to ensure API request formats are compatible with Nova Micro, so that existing code continues to work

#### Acceptance Criteria

1. WHEN invoking Nova Micro, THE System SHALL use the same request structure as Claude 3 Haiku
2. IF Nova Micro requires different request parameters, THEN THE System SHALL adapt the request format accordingly
3. THE System SHALL maintain the same prompt structure for feed suggestions
4. THE System SHALL maintain the same prompt structure for summary generation
5. THE System SHALL maintain the same prompt structure for importance calculation
6. THE System SHALL maintain the same prompt structure for article filtering
7. THE System SHALL maintain the same prompt structure for editorial column generation

### Requirement 3: Response Parsing Compatibility

**User Story:** As a developer, I want to ensure response parsing works with Nova Micro, so that existing parsing logic continues to function

#### Acceptance Criteria

1. WHEN receiving Nova Micro responses, THE System SHALL parse feed suggestions correctly
2. WHEN receiving Nova Micro responses, THE System SHALL parse AI summaries correctly
3. WHEN receiving Nova Micro responses, THE System SHALL parse importance scores correctly
4. WHEN receiving Nova Micro responses, THE System SHALL parse article filter results correctly
5. WHEN receiving Nova Micro responses, THE System SHALL parse editorial columns correctly
6. IF Nova Micro response format differs from Claude 3 Haiku, THEN THE System SHALL adapt parsing logic

### Requirement 4: Feed Suggestion Quality

**User Story:** As a user, I want feed suggestions to remain accurate and relevant, so that I receive high-quality RSS feeds

#### Acceptance Criteria

1. WHEN requesting feed suggestions, THE Feed_Suggestion_Service SHALL return at least 15 valid RSS feed URLs
2. THE Feed_Suggestion_Service SHALL return feeds relevant to the user's theme
3. THE Feed_Suggestion_Service SHALL return feeds with correct URL formats
4. THE Feed_Suggestion_Service SHALL prioritize major media and official sites
5. WHEN Nova Micro returns invalid URLs, THE System SHALL fall back to default feeds

### Requirement 5: Summary Generation Quality

**User Story:** As a user, I want AI-generated summaries to remain concise and informative, so that I can quickly understand newspaper content

#### Acceptance Criteria

1. WHEN generating summaries, THE Summary_Generation_Service SHALL produce summaries between 100-200 characters
2. THE Summary_Generation_Service SHALL produce summaries in 3 lines or fewer
3. THE Summary_Generation_Service SHALL generate summaries in the correct language (Japanese or English)
4. THE Summary_Generation_Service SHALL maintain semantic accuracy of article content

### Requirement 6: Importance Calculation Accuracy

**User Story:** As a user, I want article importance scores to remain accurate, so that the most relevant articles appear prominently

#### Acceptance Criteria

1. WHEN calculating importance, THE Importance_Calculator SHALL consider theme relevance as highest priority
2. THE Importance_Calculator SHALL apply +10 point bonus for articles with images
3. THE Importance_Calculator SHALL consider title length in scoring
4. WHEN Nova Micro fails, THE Importance_Calculator SHALL fall back to rule-based calculation

### Requirement 7: Performance Maintenance

**User Story:** As a user, I want response times to remain fast or improve, so that I have a smooth experience

#### Acceptance Criteria

1. THE Feed_Suggestion_Service SHALL complete within 30 seconds
2. THE Summary_Generation_Service SHALL complete within 10 seconds for first-time generation
3. THE Importance_Calculator SHALL complete within 5 seconds per newspaper
4. THE Article_Filter_Service SHALL complete within 5 seconds per filtering operation
5. THE Editorial_Column_Service SHALL complete within 15 seconds per column generation

### Requirement 8: Error Handling and Fallback

**User Story:** As a user, I want the system to handle errors gracefully, so that I always receive results even if AI fails

#### Acceptance Criteria

1. WHEN Nova Micro API fails, THE Feed_Suggestion_Service SHALL return default feeds
2. WHEN Nova Micro API fails, THE Summary_Generation_Service SHALL skip summary generation
3. WHEN Nova Micro API fails, THE Importance_Calculator SHALL use rule-based calculation
4. WHEN Nova Micro API fails, THE Article_Filter_Service SHALL return all articles unfiltered
5. WHEN Nova Micro API fails, THE Editorial_Column_Service SHALL return an error message
6. THE System SHALL log all Nova Micro API errors to CloudWatch

### Requirement 9: Configuration Management

**User Story:** As a developer, I want model configuration to be centralized, so that I can easily manage model settings

#### Acceptance Criteria

1. THE System SHALL define Nova Micro model ID in a central configuration file
2. THE System SHALL allow model ID to be overridden via environment variables
3. THE System SHALL support mock mode for local development without API calls
4. THE System SHALL maintain cache functionality for local development

### Requirement 10: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for Nova Micro integration, so that I can verify correct functionality

#### Acceptance Criteria

1. THE System SHALL include unit tests for Feed_Suggestion_Service with Nova Micro
2. THE System SHALL include unit tests for Summary_Generation_Service with Nova Micro
3. THE System SHALL include unit tests for Importance_Calculator with Nova Micro
4. THE System SHALL include unit tests for Article_Filter_Service with Nova Micro
5. THE System SHALL include unit tests for Editorial_Column_Service with Nova Micro
6. THE System SHALL maintain test coverage above 60%

### Requirement 11: Backward Compatibility

**User Story:** As a developer, I want to ensure existing functionality is not broken, so that users experience no disruption

#### Acceptance Criteria

1. THE System SHALL maintain the same API endpoints after migration
2. THE System SHALL maintain the same request/response formats for all endpoints
3. THE System SHALL maintain the same error handling behavior
4. THE System SHALL maintain the same caching behavior
5. THE System SHALL maintain the same logging format

### Requirement 12: Cost Monitoring

**User Story:** As a system administrator, I want to monitor AI inference costs, so that I can verify cost reduction

#### Acceptance Criteria

1. THE System SHALL log Nova Micro API call counts to CloudWatch
2. THE System SHALL log Nova Micro response times to CloudWatch
3. THE System SHALL log Nova Micro token usage to CloudWatch
4. THE System SHALL enable cost comparison between Claude 3 Haiku and Nova Micro

### Requirement 13: Rollback Capability

**User Story:** As a developer, I want the ability to rollback to Claude 3 Haiku, so that I can quickly revert if issues occur

#### Acceptance Criteria

1. THE System SHALL support model ID configuration via environment variables
2. WHEN environment variable is set to Claude 3 Haiku model ID, THE System SHALL use Claude 3 Haiku
3. WHEN environment variable is set to Nova Micro model ID, THE System SHALL use Nova Micro
4. THE System SHALL not require code changes for model switching
