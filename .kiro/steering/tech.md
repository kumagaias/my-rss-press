# Technical Architecture - MyRSSPress

This document describes MyRSSPress-specific technical details.

**Related Documents:**
- [tech-common.md](./tech-common.md) - General best practices (TypeScript conventions, testing strategy, security, etc.)
- [structure.md](./structure.md) - Project structure
- [project-standards.md](./project-standards.md) - Project standards

---

## Overview

MyRSSPress is a web application deployed on AWS using a serverless architecture. The frontend is built with Next.js + Amplify, and the backend with Lambda + Hono.

## Technology Stack

### Frontend
- **Framework**: Next.js 15.x (App Router)
- **Runtime**: Node.js 24.x LTS (Active LTS) or 22.x LTS (Maintenance LTS)
- **Language**: TypeScript 5.9.x
- **Styling**: Tailwind CSS 3.x
- **Hosting**: AWS Amplify
- **State Management**: React Context
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: AWS Lambda (Node.js 24.x or 22.x)
- **Framework**: Hono 4.x
- **Language**: TypeScript 5.9.x
- **Database**: DynamoDB
- **API Gateway**: AWS API Gateway
- **Validation**: Zod 3.x

### Infrastructure
- **IaC**: Terraform 1.11.x (stable version)
- **Container Registry**: Amazon ECR
- **CI/CD**: AWS Amplify (Frontend), GitHub Actions (Backend)
- **Monitoring**: CloudWatch
- **CDN**: CloudFront
- **Primary Region**: ap-northeast-1 (Tokyo)
- **ACM Region**: us-east-1 (CloudFront certificates only)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    CloudFront (CDN)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Amplify (Next.js Hosting)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Next.js App (SSR/SSG)                               │  │
│  │  - Pages & Components                                │  │
│  │  - Client-side Logic                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Lambda Functions (Hono)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes → Services → Repositories                    │  │
│  │  - Newspaper Management                              │  │
│  │  - RSS Feed Processing                               │  │
│  │  - AI Feed Suggestions                               │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      DynamoDB                                │
│  - Newspapers Table                                          │
│  - Feeds Table                                               │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture (Next.js + Amplify)

### Hosting & Deployment

- Host Next.js application using AWS Amplify
- Leverage Amplify Hosting's automatic deployment features
- Separate environments by branch (main → production, develop → staging)
- Optimize performance using CloudFront CDN

### Component Architecture

- Use functional components and hooks
- Follow Container/Presentational pattern
- Separate business logic from UI components
- Each component follows single responsibility principle

### State Management

- Use React Context for global state
- Prefer `useState` for local component state
- Use `useReducer` for complex state logic
- Maintain immutability when updating state

### Performance Optimization

- Memoize expensive calculations with `useMemo`
- Prevent unnecessary re-renders with `React.memo`
- Use `useCallback` for event handlers passed to child components
- Optimize performance by appropriately using SSR/SSG

### API Integration

```typescript
// lib/api/newspapers.ts
export const fetchNewspapers = async (sortBy: 'popular' | 'recent') => {
  const response = await fetch(`${API_BASE_URL}/api/newspapers?sort=${sortBy}`);
  if (!response.ok) throw new Error('Failed to fetch newspapers');
  return response.json();
};
```

- Use `fetch` for backend API communication
- Consolidate API calls in `lib/api` directory
- Implement proper error handling
- Manage loading states
- Share API response type definitions

### Environment Variables

```
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_APP_ENV=production
```

- Use `NEXT_PUBLIC_` prefix to make environment variables available on client side
- Manage sensitive information as server-side environment variables
- Separate settings by environment with `.env.local`, `.env.development`, `.env.production`

## Backend Architecture (Lambda + Hono)

### Serverless Architecture

- Serverless architecture using AWS Lambda
- Build API endpoints using Hono framework
- Write type-safe code with TypeScript
- Functions follow single responsibility principle

### Timezone Handling

**All dates and times MUST use JST (Asia/Tokyo, UTC+9)**

- **Date validation**: Compare dates in JST
- **Date filtering**: Filter articles by JST date ranges
- **Date display**: Display dates in JST to users
- **Database storage**: Store dates in ISO 8601 format with timezone
- **Cleanup schedule**: Run at 3 AM JST (cron: `0 18 * * ? *` in UTC)

**Implementation:**
```typescript
// Get current date in JST
const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

// Parse date string as JST
const dateJST = new Date(dateString + 'T00:00:00+09:00');

// Compare dates in JST
const todayJST = new Date(nowJST);
todayJST.setHours(0, 0, 0, 0);
```

**Reason**: Although MyRSSPress is primarily for US/UK users, the development team is in Japan (JST). Using JST for all date operations ensures consistency in development, debugging, and operations. Users see dates in their local timezone in the UI.

### Layered Architecture

```
Routes (Hono) → Services → Repositories → DynamoDB
```

1. **Routes Layer**: Accept HTTP requests and return responses
2. **Services Layer**: Implement business logic
3. **Repositories Layer**: Abstract data access
4. **Data Layer**: DynamoDB

### Hono Best Practices

```typescript
// routes/newspapers.ts
app.post('/api/newspapers', async (c) => {
  const body = await c.req.json();
  const validated = validateNewspaperInput(body);
  const result = await newspaperService.create(validated);
  return c.json({ data: result }, 201);
});
```

- Keep route handlers concise, place business logic in services layer
- Leverage middleware for cross-cutting concerns (authentication, logging, error handling)
- Execute validation at route level
- Return responses in consistent format

### Hono Local Development

Hono works in both local development and Lambda production environments.

#### Application Structure

```typescript
// backend/src/app.ts - Hono application (common)
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Routes
app.get('/api/health', (c) => c.json({ status: 'ok' }));
app.post('/api/newspapers', async (c) => {
  // ... business logic
});

// backend/src/dev.ts - Local development server
import { serve } from '@hono/node-server';
import { app } from './app';

const port = process.env.PORT || 3001;

serve({
  fetch: app.fetch,
  port: Number(port),
});

console.log(`🚀 Server running at http://localhost:${port}`);

// backend/src/lambda.ts - Lambda handler
import { app } from './app';

export const handler = app.fetch;
```

#### Local Development Commands

```json
// backend/package.json
{
  "scripts": {
    "dev": "tsx watch src/dev.ts",
    "build": "tsc",
    "start": "node dist/dev.js",
    "test": "vitest"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### Local Execution

```bash
# Start development server (with hot reload)
cd backend
npm run dev

# Test with browser or curl
curl http://localhost:3001/api/health
```

#### Environment Variable Management

```typescript
// backend/src/config.ts
export const config = {
  // Dummy values for local development, AWS Secrets Manager for production
  bedrockRegion: process.env.BEDROCK_REGION || 'ap-northeast-1',
  dynamodbTable: process.env.DYNAMODB_TABLE || 'newspapers-local',
  isLocal: process.env.NODE_ENV !== 'production',
};

// backend/.env.local (gitignored)
BEDROCK_REGION=ap-northeast-1
DYNAMODB_TABLE=newspapers-local
NODE_ENV=development
```

#### Testing AWS Services Locally

**DynamoDB Local:**
```bash
# Start DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Connection configuration
const dynamoClient = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  region: 'ap-northeast-1',
});
```

**Bedrock (Use actual API from local):**

Since Bedrock has no local emulator, use the actual AWS Bedrock API even in local development.

```typescript
// backend/src/services/bedrockService.ts
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { config } from '../config';

// Use same client for both local development and production
const bedrockClient = new BedrockRuntimeClient({
  region: config.bedrockRegion,
  // Use AWS CLI credentials for local development
  // Use Lambda IAM role for production
});

export async function suggestFeeds(theme: string): Promise<FeedSuggestion[]> {
  const prompt = `User is interested in "${theme}". Please suggest 3 related RSS feeds.`;
  
  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  
  const response = await bedrockClient.send(command);
  const suggestions = parseBedrockResponse(response);
  
  // Validate feed URLs (post-Bedrock processing)
  const validatedSuggestions = [];
  for (const suggestion of suggestions) {
    const isValid = await validateFeedUrl(suggestion.url);
    if (isValid) {
      validatedSuggestions.push(suggestion);
    }
  }
  
  return validatedSuggestions.length > 0 
    ? validatedSuggestions 
    : getDefaultFeeds();
}

// Feed URL validation (HEAD request)
async function validateFeedUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok; // true only for 200 OK
  } catch (error) {
    return false;
  }
}
```

**Feed Suggestion Processing Flow:**

```
1. User input (theme)
   ↓
2. Bedrock API call
   - Request 10 feed suggestions from Claude 3 Haiku
   - Include constraint to request only real feeds
   ↓
3. Parse AI response
   - Extract up to 10 feeds in JSON format
   ↓
4. Feed URL validation (parallel execution) ★Existence check here
   - HEAD request to each URL (5 second timeout)
   - Valid only if 200 OK
   - Skip invalid URLs
   - Parallel execution with Promise.all (up to 15x faster)
   ↓
5. Return results
   - Return only valid feeds
   - Supplement with default feeds (BBC, NYT, etc.) if less than 5
   - Return maximum 10 feeds
```

**Performance Optimization:**

1. **Feed suggestion count adjustment** (Issue #15)
   - Initial: 15 feed suggestions → Response time ~60 seconds
   - Optimized: 10 feed suggestions → Response time ~30-40 seconds
   - Reason: Reduced Bedrock token generation, reduced URL validation count

2. **URL validation parallelization**
   - Sequential execution: 15 feeds × 5 seconds = max 75 seconds
   - Parallel execution: max 5 seconds (all executed in parallel)
   - Improvement: up to 15x faster

3. **Lambda timeout setting**
   - Initial: 30 seconds → 504 Gateway Timeout occurred
   - Optimized: 60 seconds → Sufficient processing time secured

**Benefits of validation:**
- Exclude fake URLs and non-existent feeds
- Provide only reliably accessible feeds to users
- Prevent incorrect suggestions due to AI hallucination

**Feed count design decisions:**
- **10 suggestions**: Number of requests to Bedrock
- **5 minimum guarantee**: Threshold for supplementing with default feeds
- **5 default feeds**: Reliable feeds (BBC, NYT, Reuters, etc.)
- Reason: Provide sufficient choices to users even when many URLs are invalid

**Local Development Setup:**

1. **AWS CLI configuration:**
```bash
# Install AWS CLI (if not installed)
brew install awscli

# Configure AWS credentials
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region name: ap-northeast-1
# Default output format: json
```

2. **Enable Bedrock Model Access:**
```bash
# Execute in AWS Console:
# 1. Access Bedrock console
# 2. Model access → Manage model access
# 3. Enable Claude 3 Haiku
```

3. **Check IAM permissions:**
IAM user for local development needs the following permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0"
      ]
    }
  ]
}
```

4. **Environment variable configuration:**
```bash
# backend/.env.local
BEDROCK_REGION=ap-northeast-1
AWS_PROFILE=default  # When using multiple AWS profiles
```

**Cost Management:**

Cost management when using Bedrock in local development:

```typescript
// backend/src/config.ts
export const config = {
  bedrockRegion: process.env.BEDROCK_REGION || 'ap-northeast-1',
  isLocal: process.env.NODE_ENV !== 'production',
  
  // Enable cache in local development to reduce costs
  enableCache: process.env.ENABLE_BEDROCK_CACHE !== 'false',
};

// backend/src/services/bedrockService.ts
const cache = new Map<string, FeedSuggestion[]>();

export async function suggestFeeds(theme: string): Promise<FeedSuggestion[]> {
  // Use cache in local development
  if (config.isLocal && config.enableCache) {
    const cached = cache.get(theme);
    if (cached) {
      console.log('Using cached Bedrock response');
      return cached;
    }
  }
  
  // Call Bedrock API
  const result = await callBedrockAPI(theme);
  
  // Save to cache
  if (config.isLocal && config.enableCache) {
    cache.set(theme, result);
  }
  
  return result;
}
```

**Mock Mode (Optional):**

To completely avoid Bedrock API calls:

```typescript
// backend/.env.local
USE_BEDROCK_MOCK=true

// backend/src/services/bedrockService.ts
export async function suggestFeeds(theme: string): Promise<FeedSuggestion[]> {
  // If mock mode is enabled
  if (process.env.USE_BEDROCK_MOCK === 'true') {
    console.log('Using mock Bedrock response');
    return [
      {
        url: 'https://news.ycombinator.com/rss',
        title: 'Hacker News',
        reasoning: `Tech news related to ${theme}`,
      },
      {
        url: 'https://techcrunch.com/feed/',
        title: 'TechCrunch',
        reasoning: `Startup news about ${theme}`,
      },
    ];
  }
  
  // Call actual Bedrock API
  return await callBedrockAPI(theme);
}
```

**Recommended Approach:**

1. **Normal development**: Use actual Bedrock API (cache enabled)
2. **Offline development**: Use mock mode
3. **Testing**: Use mocks to reduce costs

#### Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal"
    }
  ]
}
```

### Lambda Function Design

```typescript
// handlers/api.ts
export const handler = async (event: APIGatewayProxyEvent) => {
  const app = new Hono();
  setupRoutes(app);
  return await app.fetch(new Request(event));
};
```

- Each Lambda function has a single responsibility
- Keep dependencies minimal to minimize cold start time
- Manage configuration using environment variables
- Keep Lambda function handlers thin, delegate logic to services

### Error Handling

```typescript
class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Error handling middleware
app.onError((err, c) => {
  const statusCode = err.statusCode || 500;
  return c.json({ error: err.message }, statusCode);
});
```

- Define and use custom error classes
- Return errors with appropriate HTTP status codes
- **Error messages MUST be in English** (for consistency and debugging)
- UI can translate error messages for display to users
- Hide detailed error information in production

### API Design

```typescript
// Success response
{
  "data": { ... },
  "meta": { "timestamp": "2025-11-28T..." }
}

// Error response
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

- Follow RESTful API principles
- Use nouns for endpoints, avoid verbs
- Consider versioning (e.g., `/api/v1/newspapers`)
- Support pagination
- Responses have consistent structure

### Validation

```typescript
import { z } from 'zod';

const NewspaperSchema = z.object({
  name: z.string().min(1).max(100),
  feedUrls: z.array(z.string().url()).min(1),
  isPublic: z.boolean().optional(),
});

type NewspaperInput = z.infer<typeof NewspaperSchema>;
```

- Always validate input data
- Use validation libraries like Zod
- Return validation errors with clear messages

## Phase 2: Advanced Features Implementation

### Language Detection Service

**Purpose**: Automatically detect article languages for filtering

**Implementation:**
```typescript
// backend/src/services/languageDetectionService.ts
export function detectLanguage(text: string): 'JP' | 'EN' {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g;
  const japaneseChars = (text.match(japaneseRegex) || []).length;
  const totalChars = text.length;
  
  // >10% Japanese characters → JP
  return (japaneseChars / totalChars) > 0.1 ? 'JP' : 'EN';
}

export async function detectLanguages(
  articles: Article[],
  feedLanguages: Map<string, string>
): Promise<string[]> {
  const languages = new Set<string>();
  
  for (const article of articles) {
    // Priority 1: RSS language field
    const rssLang = feedLanguages.get(article.feedSource);
    if (rssLang) {
      languages.add(rssLang.startsWith('ja') ? 'JP' : 'EN');
      continue;
    }
    
    // Priority 2: Content detection
    const text = `${article.title} ${article.description || ''}`;
    languages.add(detectLanguage(text));
  }
  
  return Array.from(languages).sort(); // EN, JP
}
```

**Key Points:**
- Unicode ranges: Hiragana (3040-309F), Katakana (30A0-30FF), Kanji (4E00-9FAF)
- 10% threshold to avoid false positives
- RSS `<language>` field takes priority
- Returns sorted array for consistency

### Summary Generation Service

**Purpose**: Generate AI-powered newspaper summaries

**Implementation:**
```typescript
// backend/src/services/summaryGenerationService.ts
export async function generateSummary(
  articles: Article[],
  theme: string,
  languages: string[]
): Promise<string | null> {
  const summaryLang = determineSummaryLanguage(languages);
  const topArticles = articles
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, 10);
  
  const prompt = summaryLang === 'ja'
    ? `以下の記事を3行（100-200文字）で要約してください...`
    : `Summarize the following articles in 3 lines (100-200 chars)...`;
  
  try {
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-haiku-20241022-v1:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    
    const response = await bedrockClient.send(command);
    return parseSummary(response);
  } catch (error) {
    console.error('Summary generation failed:', error);
    return null;
  }
}

export function determineSummaryLanguage(languages: string[]): 'ja' | 'en' {
  // JP only → Japanese, otherwise → English
  return languages.length === 1 && languages[0] === 'JP' ? 'ja' : 'en';
}
```

**Key Points:**
- Uses top 10 articles by importance
- 10-second timeout with 3 retries (exponential backoff)
- Language determined by newspaper's language mix
- Returns null on failure (graceful degradation)
- Summary length: 100-250 characters

### Historical Newspaper Service

**Purpose**: Generate and cache newspapers for specific dates

**Implementation:**
```typescript
// backend/src/services/historicalNewspaperService.ts
export function validateDate(dateStr: string): { valid: boolean; error?: string } {
  const date = new Date(dateStr + 'T00:00:00+09:00'); // JST
  const now = new Date();
  const today = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  today.setHours(0, 0, 0, 0);
  
  // Future dates rejected
  if (date > today) {
    return { valid: false, error: 'Future newspapers are not available' };
  }
  
  // Dates >7 days old rejected
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  if (date < sevenDaysAgo) {
    return { valid: false, error: 'Newspapers older than 7 days are not available' };
  }
  
  return { valid: true };
}

export async function generateHistoricalNewspaper(
  newspaperId: string,
  date: string,
  feedUrls: string[]
): Promise<Newspaper> {
  // Check if already cached
  const cached = await getNewspaperByDate(newspaperId, date);
  if (cached) return cached;
  
  // Generate new newspaper for that date
  const articles = await fetchArticlesForDate(feedUrls, date);
  const newspaper = await createNewspaper({
    newspaperId,
    newspaperDate: date,
    articles,
    // ... other fields
  });
  
  return newspaper;
}
```

**Key Points:**
- All dates in JST (Asia/Tokyo, UTC+9)
- Valid range: today to 7 days ago
- First access generates, second access retrieves cache
- Articles filtered by target date (00:00 to current time)
- URL format: `/newspapers/[id]/[YYYY-MM-DD]`

### Cleanup Service

**Purpose**: Automatically delete old newspapers

**Implementation:**
```typescript
// backend/src/services/cleanupService.ts
export async function cleanupOldNewspapers(): Promise<void> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.toISOString();
  
  let lastEvaluatedKey: Record<string, any> | undefined;
  
  do {
    const result = await dynamoClient.send(new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'newspaperDate < :cutoff',
      ExpressionAttributeValues: { ':cutoff': cutoffDate },
      Limit: 25,
      ExclusiveStartKey: lastEvaluatedKey,
    }));
    
    if (result.Items && result.Items.length > 0) {
      await batchDelete(result.Items);
    }
    
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
}
```

**Key Points:**
- Triggered daily at 3 AM JST by EventBridge
- Batch size: 25 newspapers per scan
- Continues until all old newspapers deleted
- Deletes newspapers older than 7 days
- Idempotent (safe to run multiple times)

## Data Architecture

### DynamoDB Design

#### Newspapers Table

```
PK: NEWSPAPER#{newspaperId}
SK: METADATA
Attributes:
  - newspaperId: string
  - name: string
  - userName: string
  - feedUrls: string[]
  - createdAt: string (ISO 8601)
  - updatedAt: string (ISO 8601)
  - viewCount: number
  - isPublic: boolean
```

#### GSI: PublicNewspapers

```
PK: PUBLIC
SK: VIEWS#{viewCount}#{newspaperId}
Purpose: Retrieve newspapers sorted by popularity
```

#### GSI: RecentNewspapers

```
PK: PUBLIC
SK: CREATED#{createdAt}#{newspaperId}
Purpose: Retrieve newspapers sorted by recency
```

### Access Patterns

1. Get by newspaper ID: `GetItem(PK=NEWSPAPER#{id}, SK=METADATA)`
2. Get public newspapers by popularity: `Query(GSI=PublicNewspapers, PK=PUBLIC, SK begins_with VIEWS#)`
3. Get public newspapers by recency: `Query(GSI=RecentNewspapers, PK=PUBLIC, SK begins_with CREATED#)`

## Security

### Frontend Security

- Manage sensitive information with environment variables
- XSS protection (React default protection)
- CSRF protection (SameSite Cookie)
- Content Security Policy (CSP) configuration

### Backend Security

- Store sensitive information in environment variables, do not hardcode in code
- Manage sensitive information using AWS Secrets Manager
- Configure CORS appropriately
- Implement rate limiting
- Sanitize input data
- Apply principle of least privilege with IAM roles

### Dependency Security (npm vulnerability check)

**Overview:**

Automatically check npm dependency vulnerabilities and prevent pushes if Medium or higher severity vulnerabilities are found.

**Check Tool:**
- `npm audit` - npm official vulnerability check tool
- Severity levels: Critical, High, Moderate, Low

**Automatic Check Timing:**
1. **pre-push hook**: Automatic check on `git push` execution
2. **Manual execution**: `make test-vulnerabilities` or `make audit`

**Severity Response Policy:**
- **Critical/High/Moderate**: Block push, immediate fix required
- **Low**: Warning only, push allowed (consider periodic fixes)

**Execution Method:**

```bash
# Manual vulnerability check
make test-vulnerabilities
# or
make audit

# All tests (unit + security + vulnerabilities)
make test
```

**Response When Vulnerabilities Found:**

```bash
# 1. Navigate to relevant directory
cd frontend  # or backend

# 2. Check vulnerability details
npm audit

# 3. Attempt automatic fix (non-destructive)
npm audit fix

# 4. If automatic fix fails, fix with destructive changes
npm audit fix --force

# 5. Commit package-lock.json
git add package-lock.json
git commit -m "fix: Update dependencies to fix vulnerabilities"
```

**Script Locations:**
- `scripts/npm-audit-check.sh` - Vulnerability check script
- `.husky/pre-push` - pre-push hook configuration

**Check Targets:**
- `frontend/` - Frontend dependencies
- `backend/` - Backend dependencies
- Root directory (if package.json exists)

**Output Example:**

```
🔍 Starting npm vulnerability check...

📦 Checking Frontend vulnerabilities...
❌ Vulnerabilities found in Frontend:
  Critical: 0
  High: 0
  Moderate: 2

Fix method:
  cd frontend
  npm audit fix
  # Or fix with destructive changes:
  npm audit fix --force

❌ Medium or higher vulnerabilities found. Please fix and push again.
```

**Best Practices:**
1. Regularly run `npm audit` to check vulnerabilities
2. Update dependencies carefully and run tests
3. `npm audit fix --force` includes destructive changes, always test after execution
4. For unfixable vulnerabilities, consider alternative packages or report issue
5. Run vulnerability checks in CI/CD pipeline

**Response to Unfixable Vulnerabilities:**

When vulnerabilities cannot be fixed immediately due to dependency conflicts:

1. **Assess impact**: Development environment only, or production affected?
2. **Create GitHub Issue**: Record vulnerability details and fix plan
3. **Temporary workaround**: 
   - If development environment only, verify no impact on production build
   - If production affected, consider alternative packages or emergency response
4. **Periodic re-evaluation**: Retry fix when updating dependencies

**Example: esbuild vulnerability (GHSA-67mh-4wv8-2f99)**
- Impact: Development server only (no impact on production build)
- Response: Immediate fix difficult due to Storybook/Vite compatibility issues
- Plan: Re-evaluate after Storybook 9.x release

## Monitoring & Logging

### Logging

```typescript
const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta }));
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({ 
      level: 'error', 
      message, 
      error: error?.message,
      stack: error?.stack,
      ...meta 
    }));
  },
};
```

- Use structured logging (JSON format)
- Output logs to CloudWatch Logs
- Properly log errors and warnings
- Record performance metrics

### Monitoring

- Monitor performance with CloudWatch Metrics
- Set alerts with CloudWatch Alarms
- Tracing with X-Ray
- Get detailed metrics with Lambda Insights

## Performance Optimization

### Frontend

- Appropriately use SSR/SSG
- Image optimization (Next.js Image)
- Code splitting (Dynamic Import)
- Cache with CloudFront CDN

### Backend

- Lambda function warm-up
- DynamoDB query optimization
- Leverage parallel processing (Promise.all)
- Cache with ElastiCache (future enhancement)

## Testing Strategy

### Frontend Testing

- **Unit Tests**: Jest/Vitest
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright
- **Coverage Target**: 60% or higher

#### E2E Testing with Playwright

**Test Framework**: Playwright 1.40.x or higher

**Test Structure:**
```
frontend/tests/e2e/
├── fixtures/              # Test fixtures
│   ├── auth.ts           # Authentication fixtures
│   └── test-data.ts      # Test data
├── pages/                 # Page Object Model
│   ├── HomePage.ts
│   ├── NewspaperPage.ts
│   └── FeedSelectorPage.ts
├── specs/                 # Test specs (by feature)
│   ├── newspaper/
│   │   ├── create-newspaper.spec.ts
│   │   ├── view-newspaper.spec.ts
│   │   └── share-newspaper.spec.ts
│   ├── feed/
│   │   ├── select-feeds.spec.ts
│   │   └── suggest-feeds.spec.ts
│   └── home/
│       ├── popular-newspapers.spec.ts
│       └── recent-newspapers.spec.ts
├── utils/                 # Helper functions
│   ├── api-helpers.ts
│   └── test-helpers.ts
└── setup/                 # Setup files
    ├── global-setup.ts
    └── global-teardown.ts
```

**Page Object Model (POM):**
```typescript
// tests/e2e/pages/HomePage.ts
import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly popularNewspapers: Locator;
  readonly recentNewspapers: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: /Create Newspaper/i });
    this.popularNewspapers = page.getByTestId('popular-newspapers');
    this.recentNewspapers = page.getByTestId('recent-newspapers');
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickCreateNewspaper() {
    await this.createButton.click();
  }

  async getPopularNewspaperCount() {
    return await this.popularNewspapers.locator('article').count();
  }
}
```

**Test Spec Example:**
```typescript
// tests/e2e/specs/newspaper/create-newspaper.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { FeedSelectorPage } from '../../pages/FeedSelectorPage';
import { NewspaperPage } from '../../pages/NewspaperPage';

test.describe('Newspaper creation flow', () => {
  test('Can create newspaper by selecting feeds from theme', async ({ page }) => {
    const homePage = new HomePage(page);
    const feedSelector = new FeedSelectorPage(page);
    const newspaperPage = new NewspaperPage(page);

    await homePage.goto();
    await homePage.clickCreateNewspaper();
    await feedSelector.enterTheme('Technology');
    await feedSelector.clickSuggestFeeds();
    await expect(feedSelector.suggestedFeeds).toBeVisible();
    await feedSelector.selectFeed(0);
    await feedSelector.selectFeed(1);
    await feedSelector.clickGenerate();
    await expect(newspaperPage.newspaperTitle).toBeVisible();
    await expect(newspaperPage.articles).toHaveCount(10, { timeout: 10000 });
  });
});
```

**Playwright Configuration:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Execution Commands:**
```json
// package.json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

**Best Practices:**
- Increase reusability with Page Object Model
- Organize test specs by feature
- Manage test data with fixtures
- Enable retries in CI environment
- Diagnose issues with screenshots and traces
- Run tests on multiple browsers

### Backend Testing

- **Unit Tests**: Jest/Vitest
- **Integration Tests**: Supertest + Hono
- **Mock**: AWS SDK Mock
- **Coverage Target**: 60% or higher

## Deployment

### CI/CD Strategy

**Infrastructure (Terraform)**: Manual deployment from local
**Frontend**: AWS Amplify (automatic deployment)
**Backend**: GitHub Actions + ECR + Lambda

### Infrastructure Deployment (Terraform)

**Deployment Method:**
Execute `terraform apply` from local environment

**Directory Structure:**
```
infra/
├── bootstrap/            # Terraform state management resources (initial only)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── README.md
├── environments/
│   └── production/
│       ├── main.tf
│       ├── backend.tf    # S3 backend configuration
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
└── modules/
    ├── secrets-manager/  # Secrets Manager (sensitive information management)
    ├── ecr/              # ECR repository
    ├── lambda/           # Lambda functions (using ECR images)
    ├── api-gateway/      # API Gateway
    ├── dynamodb/         # DynamoDB
    └── amplify/          # Amplify Hosting
```

**Initial Setup (Bootstrap):**

Create S3 bucket and DynamoDB table to manage Terraform state:

```bash
# 1. Execute Bootstrap (initial only)
cd infra/bootstrap
terraform init
terraform plan
terraform apply

# Check output
terraform output
# state_bucket_name = "myrsspress-terraform-state"
# lock_table_name = "myrsspress-terraform-locks"
```

**Production Environment Deployment:**

```bash
cd infra/environments/production

# Initial only (migrate state to S3)
terraform init -migrate-state

# Check changes
terraform plan

# Execute deployment
terraform apply

# Check output
terraform output
```

**Terraform State Management:**

- **S3 Backend**: Store Terraform state in S3
- **DynamoDB Lock**: Prevent concurrent execution by multiple people
- **Encryption**: Enable AES256 encryption on S3 bucket
- **Versioning**: Retain state history

```hcl
# infra/environments/production/backend.tf
terraform {
  backend "s3" {
    bucket         = "myrsspress-production-{account-id}-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "myrsspress-terraform-locks"
    encrypt        = true
  }
}
```

**Secrets Manager Integration:**

Manage sensitive information (GitHub tokens, etc.) with Secrets Manager:

```hcl
# infra/modules/secrets-manager/main.tf
resource "aws_secretsmanager_secret" "github_token" {
  name        = "myrsspress-github-amplify-token-production"
  description = "GitHub Personal Access Token for Amplify deployment"
}

resource "aws_secretsmanager_secret_version" "github_token" {
  secret_id     = aws_secretsmanager_secret.github_token.id
  secret_string = var.github_access_token
}

# infra/modules/amplify/main.tf
data "aws_secretsmanager_secret_version" "github_token" {
  secret_id = var.github_token_secret_id
}

resource "aws_amplify_app" "main" {
  name         = var.app_name
  repository   = var.github_repository
  access_token = data.aws_secretsmanager_secret_version.github_token.secret_string
  # ...
}
```

**Benefits:**
- GitHub token not stored in Terraform state
- Easy token rotation
- Trackable with audit logs
- Automatic encryption with AWS KMS

**Terraform Configuration Example:**
```hcl
# infra/modules/lambda/main.tf
resource "aws_lambda_function" "api" {
  function_name = "myrsspress-api"
  role          = aws_iam_role.lambda_exec.arn
  
  # Use ECR image
  package_type  = "Image"
  image_uri     = "${var.ecr_repository_url}:${var.image_tag}"
  
  timeout       = 30
  memory_size   = 512
  
  environment {
    variables = {
      BEDROCK_REGION  = "ap-northeast-1"
      DYNAMODB_TABLE  = var.dynamodb_table_name
    }
  }
}
```

### Frontend Deployment

**Automatic Deployment Flow:**
1. Push code to GitHub `main` branch
2. AWS Amplify automatically detects
3. Execute build (Next.js)
4. Distribute cache with CloudFront
5. Deployment completion notification

**Configuration:**
- Define build configuration in `amplify.yml`
- Manage environment variables in Amplify console
- Preview environments automatically created (per PR)

### Backend Deployment

**GitHub Actions + ECR + Lambda**

#### Deployment Flow

```
GitHub Push (main) 
  ↓
GitHub Actions trigger
  ↓
1. Run tests (make test)
  ↓
2. Security check
  ↓
3. Build Docker image
  ↓
4. Push to ECR
  ↓
5. Update Lambda function (use new image)
```

#### Dockerfile

```dockerfile
# backend/Dockerfile
FROM public.ecr.aws/lambda/nodejs:20

# Copy dependencies
COPY package*.json ./
RUN npm ci --production

# Copy application code
COPY dist/ ./

# Specify Lambda function handler
CMD ["lambda.handler"]
```

#### GitHub Actions Configuration

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend to Lambda

on:
  push:
    branches: [main]
    paths: ['backend/**']

env:
  AWS_REGION: ap-northeast-1
  ECR_REPOSITORY: myrsspress-backend

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run tests
        run: make test
      
      - name: Build TypeScript
        run: cd backend && npm run build
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd backend
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
      
      - name: Update Lambda function
        env:
          IMAGE_URI: ${{ steps.build-image.outputs.image }}
        run: |
          aws lambda update-function-code \
            --function-name myrsspress-api \
            --image-uri $IMAGE_URI
          
          # Wait for update completion
          aws lambda wait function-updated \
            --function-name myrsspress-api
      
      - name: Verify deployment
        run: |
          # Check Lambda function state
          aws lambda get-function \
            --function-name myrsspress-api \
            --query 'Configuration.[State,LastUpdateStatus]' \
            --output text
```

#### package.json Configuration

```json
// backend/package.json
{
  "scripts": {
    "dev": "tsx watch src/dev.ts",
    "build": "tsc",
    "test": "vitest run",
    "docker:build": "docker build -t myrsspress-backend .",
    "docker:run": "docker run -p 9000:8080 myrsspress-backend"
  }
}
```

#### Local Docker Testing

```bash
# Build Docker image
cd backend
npm run build
docker build -t myrsspress-backend .

# Test Lambda locally
docker run -p 9000:8080 myrsspress-backend

# Test in another terminal
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"path": "/api/health", "httpMethod": "GET"}'
```

### Environment Strategy

**Current (Production only):**
- **Production**: main branch → production environment
- Independent resources per environment
- Separate configuration with environment variables

**Future (Multiple environments):**
- **Development**: develop branch → development environment
- **Staging**: staging branch → staging environment
- **Production**: main branch → production environment

### Secrets Management

**GitHub Secrets (Required):**
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key

**Configuration Method:**
1. GitHub repository Settings → Secrets and variables → Actions
2. Click New repository secret
3. Add above secrets

**AWS IAM Permissions:**
Permissions required for GitHub Actions:
- ECR (image push)
- Lambda (function code update)
- CloudWatch Logs (log reading)

**Terraform IAM Permissions:**
Permissions required for Terraform execution from local:
- Lambda (create/update/delete)
- API Gateway (create/update/delete)
- DynamoDB (create/update/delete)
- ECR (repository creation/management)
- IAM (role creation)
- S3 (Terraform state save/read)
- Secrets Manager (secret creation/reading)
- Amplify (application creation/management)

**Using AWS Secrets Manager:**

Manage sensitive information with AWS Secrets Manager:

1. **GitHub Token**: For Amplify deployment
   - Secret name: `myrsspress-github-amplify-token-{environment}`
   - Automatically created and managed by Terraform
   - Not stored in Terraform state

2. **Setup Procedure:**
```bash
# Terraform automatically saves token to Secrets Manager
cd infra/environments/production
terraform apply

# To manually update token
aws secretsmanager update-secret \
  --secret-id myrsspress-github-amplify-token-production \
  --secret-string "ghp_new_token_here"
```

3. **Rotation:**
   - Regenerate token in GitHub
   - Update in Secrets Manager
   - Terraform automatically uses new token on next execution

### Deployment Best Practices

1. **Pull before push**: Always run `git pull` before `git push` to incorporate remote changes
2. **Always run tests**: Run `make test` before deployment
3. **Check infrastructure changes**: Check changes with `terraform plan`
4. **Gradual deployment**: Deploy important changes gradually
5. **Image tag management**: Use Git commit SHA as image tag
6. **Rollback preparation**: Be able to revert to previous image tag
7. **Monitoring**: Check post-deployment operation with CloudWatch Logs
8. **Notification setup**: Notify deployment success/failure to Slack, etc.

**Correct Push Procedure:**
```bash
# 1. Commit changes
git add .
git commit -m "feat: Add new feature"

# 2. Incorporate remote changes (Important!)
git pull origin feat/your-branch

# 3. Resolve conflicts if any
# (Manually resolve and commit if conflicts exist)

# 4. Push
git push origin feat/your-branch
```

### Rollback Strategy

**Backend Rollback:**
```bash
# Check previous image tags
aws ecr describe-images \
  --repository-name myrsspress-backend \
  --query 'sort_by(imageDetails,& imagePushedAt)[-5:]'

# Revert to specific image tag
aws lambda update-function-code \
  --function-name myrsspress-api \
  --image-uri <ECR_REGISTRY>/myrsspress-backend:<PREVIOUS_TAG>
```

**Infrastructure Rollback:**
```bash
cd infra/environments/production

# Revert to previous state
terraform apply -target=<resource>

# Or restore from Terraform state
terraform state pull > backup.tfstate
```

## Internationalization (i18n)

### Implementation Strategy

- Application supports both Japanese and English
- Manage all user-facing text in translation files
- Always use translation keys, do not hardcode UI text
- Automatically detect language based on browser language settings

### Translation File Structure

```typescript
// lib/i18n.ts
export type Locale = 'en' | 'ja';

export const translations = {
  en: {
    appName: 'MyRSSPress',
    appTagline: 'Your Personalized Morning Digest, Curated by AI',
    // ... more translations
  },
  ja: {
    appName: 'MyRSSPress',
    appTagline: 'AIがキュレートする、あなた専用の朝刊',
    // ... more translations
  },
};

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}

export function useTranslations(locale: Locale) {
  return translations[locale];
}
```

### Usage in Components

```typescript
import { useTranslations } from '@/lib/i18n';

export default function MyComponent({ locale }: { locale: Locale }) {
  const t = useTranslations(locale);
  
  return (
    <div>
      <h1>{t.appName}</h1>
      <p>{t.appTagline}</p>
    </div>
  );
}
```

### Locale-Specific Formatting

- Format dates, numbers, currencies according to selected language locale
- Leverage `toLocaleDateString()`, `toLocaleString()`

```typescript
const dateLocale = locale === 'ja' ? 'ja-JP' : 'en-US';
const formattedDate = new Date().toLocaleDateString(dateLocale, {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
```

### Translation Management Rules

- Maintain same key structure for each language translation
- When adding new UI text, always add translations for both languages simultaneously
- Use descriptive names for translation keys (e.g., `generateNewspaper` instead of `buttonSubmit`)

**Note**: For general best practices on TypeScript conventions, code organization, testing strategy, and security, refer to [tech-common.md](./tech-common.md).

## Scalability Considerations

### Current Architecture

- Lambda: Auto-scaling
- DynamoDB: On-demand capacity
- CloudFront: Global CDN
- Amplify: Auto-scaling

### Future Enhancements

- Add cache layer with ElastiCache
- Asynchronous processing with SQS
- Complex workflows with Step Functions
- Relational data with Aurora Serverless (as needed)

## Prohibited Practices

This section defines development practices that must never be performed in the project.

### Terraform State Management

**❌ Prohibited: Managing Terraform state locally**
- Always manage Terraform state with S3 backend
- Do not commit local state files (`terraform.tfstate`) to Git
- Local backend is prohibited as state conflicts occur when multiple people work

**❌ Prohibited: Temporarily managing terraform state locally when troubleshooting errors**
- Even if errors occur, do not migrate state to local
- Correct approach:
  1. Investigate root cause of error
  2. Check changes with Terraform plan
  3. Import/remove resources with `terraform state` command as needed
  4. Resolve issues while maintaining S3 backend

**✅ Correct Method:**
```bash
# S3 backend configuration
terraform {
  backend "s3" {
    bucket         = "myrsspress-production-843925270284-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "myrsspress-terraform-locks"
    encrypt        = true
  }
}
```

**Troubleshooting Examples:**
```bash
# If lock remains
terraform force-unlock <LOCK_ID>

# Remove resource from state
terraform state rm <resource_address>

# Import resource to state
terraform import <resource_address> <resource_id>

# Check state
terraform state list
terraform state show <resource_address>
```

### Infrastructure as Code

**❌ Prohibited: Manual resource creation in AWS Console**
- Manage all infrastructure resources with Terraform
- Even in emergencies, avoid manual changes in console, update Terraform code
- Exception: S3 bucket creation during initial setup only

**❌ Prohibited: Changing resources outside Terraform management**
- Do not directly change Terraform-managed resources with AWS CLI or console
- If changes needed, update Terraform code and apply

### Deployment

**❌ Prohibited: Direct deployment to production**
- Do not deploy directly to production from local (except Terraform)
- Backend deployment goes through GitHub Actions
- Frontend deployment uses Amplify automatic deployment

**❌ Prohibited: Deployment skipping tests**
- Do not deploy when `make test` fails
- If tests fail in CI/CD pipeline, always fix before redeploying

### Security

**❌ Prohibited: Hardcoding sensitive information**
- Do not hardcode AWS credentials, API keys, passwords in code
- Use environment variables or AWS Secrets Manager

**❌ Prohibited: Storing Access Keys in GitHub Secrets**
- Use OIDC authentication for GitHub Actions
- Long-term Access Keys are prohibited

**❌ Prohibited: Disabling security checks**
- Do not disable security checks by Gitleaks
- Do not delete pre-commit hooks

**Note**: For general prohibited practices on Code Quality, Git Workflow, and Performance, refer to [tech-common.md](./tech-common.md).

---

Violating these prohibited practices can seriously impact system stability, security, and maintainability. Always comply.
