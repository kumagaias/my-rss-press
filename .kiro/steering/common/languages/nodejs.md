# Node.js/Lambda Best Practices

Node.js and AWS Lambda specific patterns and best practices.

---

## Layered Architecture

```
Routes → Services → Repositories → Database
```

- **Routes**: Handle HTTP requests/responses
- **Services**: Implement business logic
- **Repositories**: Abstract data access
- **Database**: Data storage layer

## Error Handling

```typescript
// ✅ Good: Custom error classes
class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ✅ Good: Error middleware (Hono)
app.onError((err, c) => {
  const statusCode = err.statusCode || 500;
  return c.json({ error: err.message }, statusCode);
});

// ✅ Good: Error messages in English
throw new Error('User not found'); // Not 'ユーザーが見つかりません'
```

## Async/Await

```typescript
// ✅ Good: Proper error handling
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error('Failed to fetch data:', error);
  throw error;
}

// ✅ Good: Parallel execution
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
]);

// ❌ Bad: Sequential execution when parallel is possible
const users = await fetchUsers();
const posts = await fetchPosts(); // Should use Promise.all
```

## Logging

```typescript
// ✅ Good: Structured logging (JSON)
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

// Usage
logger.info('User created', { userId: '123' });
logger.error('Failed to create user', error, { userId: '123' });
```

## Input Validation

```typescript
// ✅ Good: Use Zod for validation
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
});

type User = z.infer<typeof UserSchema>;

// In route handler
const body = await c.req.json();
const validated = UserSchema.parse(body); // Throws if invalid
```

## Lambda Specific

### Handler Pattern

```typescript
// ✅ Good: Thin handler, delegate to services
export const handler = async (event: APIGatewayProxyEvent) => {
  const app = new Hono();
  setupRoutes(app);
  return await app.fetch(new Request(event));
};
```

### Cold Start Optimization

```typescript
// ✅ Good: Initialize outside handler
const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

export const handler = async (event) => {
  // Use pre-initialized client
  const result = await dynamoClient.send(command);
};

// ❌ Bad: Initialize inside handler
export const handler = async (event) => {
  const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });
  // ...
};
```

### Environment Variables

```typescript
// ✅ Good: Centralized config
export const config = {
  region: process.env.AWS_REGION || 'ap-northeast-1',
  tableName: process.env.DYNAMODB_TABLE || 'default-table',
  isLocal: process.env.NODE_ENV !== 'production',
};

// Usage
const client = new DynamoDBClient({ region: config.region });
```

## Local Development

```typescript
// ✅ Good: Separate dev server from Lambda handler
// src/app.ts - Shared Hono app
export const app = new Hono();
app.get('/api/health', (c) => c.json({ status: 'ok' }));

// src/dev.ts - Local dev server
import { serve } from '@hono/node-server';
import { app } from './app';

serve({ fetch: app.fetch, port: 3001 });

// src/lambda.ts - Lambda handler
import { app } from './app';
export const handler = app.fetch;
```

## Testing

```typescript
// ✅ Good: Mock AWS SDK
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoMock = mockClient(DynamoDBClient);

beforeEach(() => {
  dynamoMock.reset();
});

test('fetches user from DynamoDB', async () => {
  dynamoMock.on(GetItemCommand).resolves({
    Item: { id: { S: '123' }, name: { S: 'John' } },
  });

  const user = await getUser('123');
  expect(user).toEqual({ id: '123', name: 'John' });
});
```

## Performance

```typescript
// ✅ Good: Connection pooling
const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
});

// ✅ Good: Caching
const cache = new Map<string, any>();

export async function getCachedData(key: string) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetchData(key);
  cache.set(key, data);
  return data;
}
```

## Security

```typescript
// ✅ Good: Rate limiting
import { rateLimit } from './middleware/rateLimit';

app.post('/api/endpoint', rateLimit(10, 60000), async (c) => {
  // 10 requests per minute
});

// ✅ Good: CORS configuration
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: ['https://example.com'],
  credentials: true,
}));
```
