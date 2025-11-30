# MyRSSPress Backend

Backend API for MyRSSPress, built with Hono framework on AWS Lambda.

## Tech Stack

- **Runtime**: Node.js 24.x LTS (or 22.x LTS)
- **Framework**: Hono 4.x
- **Language**: TypeScript 5.9.x
- **Validation**: Zod 3.x
- **Testing**: Vitest 2.x
- **Deployment**: AWS Lambda (ECR Image)

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Main Hono application
│   ├── dev.ts              # Local development server
│   ├── lambda.ts           # Lambda handler
│   ├── config.ts           # Configuration management
│   └── middleware/
│       └── rateLimit.ts    # Rate limiting middleware
├── tests/
│   └── unit/
│       └── middleware/
│           └── rateLimit.test.ts
├── package.json
├── tsconfig.json
└── .env.local.example      # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js 24.x LTS (or 22.x LTS)
- npm or yarn
- AWS CLI (for Bedrock and DynamoDB access)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables template
cp .env.local.example .env.local

# Edit .env.local with your configuration
```

### Development

```bash
# Start development server (with hot reload)
npm run dev

# Server will start at http://localhost:3001
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Build TypeScript
npm run build
```

## API Endpoints

### Health Check

```bash
GET /api/health
```

Response:
```json
{
  "status": "ok"
}
```

### Root

```bash
GET /
```

Response:
```json
{
  "message": "MyRSSPress API",
  "version": "0.1.0",
  "endpoints": {
    "health": "/api/health"
  }
}
```

## Middleware

### CORS

Configured to allow requests from:
- `https://my-rss-press.com`
- `https://www.my-rss-press.com`
- `http://localhost:3000` (development only)

### Rate Limiting

- **General API endpoints**: 100 requests/minute per IP
- **AI suggestion endpoints**: 10 requests/minute per IP (to be implemented)
- **Newspaper generation**: 20 requests/minute per IP (to be implemented)

Rate limit responses return HTTP 429 with retry-after information.

### Logging

All requests are logged using Hono's built-in logger middleware.

## Environment Variables

Create a `.env.local` file based on `.env.local.example`:

```bash
# AWS Configuration
BEDROCK_REGION=ap-northeast-1
DYNAMODB_TABLE=newspapers-local

# Environment
NODE_ENV=development

# Bedrock Settings
ENABLE_BEDROCK_CACHE=true
USE_BEDROCK_MOCK=false

# DynamoDB Local (optional)
# DYNAMODB_ENDPOINT=http://localhost:8000

# AWS Credentials (optional, uses AWS CLI credentials by default)
# AWS_ACCESS_KEY_ID=your-access-key-id
# AWS_SECRET_ACCESS_KEY=your-secret-access-key
# AWS_PROFILE=default
```

## Local Development with AWS Services

### Bedrock

The application uses AWS Bedrock (Claude 3.5 Haiku) for AI features. For local development:

1. **Configure AWS CLI**:
```bash
aws configure
```

2. **Enable Bedrock Model Access**:
   - Go to AWS Console → Bedrock → Model access
   - Enable Claude 3.5 Haiku

3. **Cost Management**:
   - Set `ENABLE_BEDROCK_CACHE=true` to cache responses locally
   - Set `USE_BEDROCK_MOCK=true` for offline development (uses mock data)

### DynamoDB

For local development, you can use DynamoDB Local:

```bash
# Start DynamoDB Local with Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Set endpoint in .env.local
DYNAMODB_ENDPOINT=http://localhost:8000
```

## Deployment

### Docker Build

```bash
# Build Docker image
npm run docker:build

# Run locally (Lambda emulation)
npm run docker:run

# Test Lambda function
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{"path": "/api/health", "httpMethod": "GET"}'
```

### AWS Lambda Deployment

Deployment is automated via GitHub Actions:

1. Push to `main` branch
2. GitHub Actions builds Docker image
3. Pushes to Amazon ECR
4. Updates Lambda function with new image

See `.github/workflows/deploy-backend.yml` for details.

## Testing

### Unit Tests

```bash
npm test
```

Tests are located in `tests/unit/` and cover:
- Middleware functionality (rate limiting, CORS)
- Service layer logic
- API endpoint handlers

### Integration Tests

Integration tests will be added in future phases to test:
- AWS Bedrock integration
- DynamoDB operations
- RSS feed fetching

## Architecture

### Layered Architecture

```
Routes (Hono) → Services → Repositories → DynamoDB
```

1. **Routes Layer**: HTTP request handling and response
2. **Services Layer**: Business logic implementation
3. **Repositories Layer**: Data access abstraction
4. **Data Layer**: DynamoDB

### Hono Application

The Hono application is designed to work in both local development and Lambda environments:

- `app.ts`: Core Hono application (shared)
- `dev.ts`: Local development server
- `lambda.ts`: Lambda handler wrapper

## Security

### Rate Limiting

IP-based rate limiting prevents abuse:
- Tracks requests per IP address
- Configurable limits per endpoint
- Automatic cleanup of old records

### CORS

Strict CORS policy allows only authorized origins.

### Input Validation

All user inputs are validated using Zod schemas (to be implemented).

## Performance

### Cold Start Optimization

- Minimal dependencies
- Efficient middleware chain
- Lambda function kept warm in production

### Concurrent Processing

- Parallel RSS feed fetching
- Async/await throughout
- Target: <5 seconds for newspaper generation

## Monitoring

### CloudWatch Logs

All logs are sent to CloudWatch Logs:
- Request/response logs
- Error logs with stack traces
- Performance metrics

### Metrics

Key metrics to monitor:
- Request count
- Error rate
- Response time
- Rate limit hits

## Contributing

1. Create a feature branch: `git checkout -b feat/task-X.X-description`
2. Make changes and test locally
3. Run tests: `npm test`
4. Build: `npm run build`
5. Commit: `git commit -m "feat: description (task-X.X)"`
6. Push and create PR

## License

Private project - All rights reserved
