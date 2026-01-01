# Feed Usage Tracking - Requirements

**Issue**: #50  
**Phase**: 3.5  
**Status**: In Progress

## Overview
Learn from user behavior by tracking which feeds successfully generate newspapers and use this data to improve future suggestions.

## Goals
1. Track feed usage and success rates
2. Identify high-quality feeds automatically
3. Improve feed suggestions over time
4. Provide data-driven insights

## Requirements

### FR-1: Record Feed Usage
**When**: After newspaper generation  
**What**: Record each feed's performance
- Feed URL
- Category ID (from theme)
- Article count fetched
- Success/failure status
- Timestamp

### FR-2: Calculate Statistics
**Metrics**:
- Usage count (total uses)
- Success rate (% successful)
- Average articles per use
- Last used timestamp

### FR-3: Query Popular Feeds
**Query**: Top N feeds by usage for a category  
**Sort**: By usage count (descending)  
**Limit**: Configurable (default: 10)

### FR-4: Integrate with Suggestions
**Priority**: Popular > Bedrock > Category > Default  
**Limit**: Add up to 5 popular feeds  
**Dedup**: Remove duplicates

## Non-Functional Requirements

### Performance
- Recording: < 100ms overhead
- Query: < 50ms (cached)
- No impact on newspaper generation

### Reliability
- Graceful degradation if tracking fails
- Don't block newspaper creation
- Async recording

### Data
- Store in existing DynamoDB table
- Use GSI1 for efficient queries
- Atomic counter updates

## Success Criteria
- ✅ 100% of newspapers record usage
- ✅ Popular feeds in top 5 suggestions
- ✅ No performance degradation
- ✅ Success rate tracking accurate
