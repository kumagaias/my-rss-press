# Project Structure

## Overview

The MyRSSPress project adopts a monorepo structure with separated frontend (Next.js) and backend (Lambda + Hono).

## Root Directory Structure

```
myrsspress/
├── frontend/              # Next.js frontend application
├── backend/               # Lambda + Hono backend
├── infra/                 # Infrastructure (Terraform)
│   ├── environments/     # Environment-specific configuration
│   │   └── production/  # Production environment (current)
│   └── modules/          # Reusable Terraform modules
├── .kiro/                 # Kiro configuration and specs
│   ├── specs/            # Feature specifications
│   │   ├── phase-1/     # Phase 1 (MVP)
│   │   └── phase-2/     # Phase 2 (Extended features)
│   ├── steering/         # Development guidelines
│   │   ├── project-standards.md  # Project standards
│   │   ├── tech.md              # Technical architecture and coding conventions
│   │   └── structure.md         # Project structure (this file)
│   └── hooks/            # Agent hooks
├── scripts/              # Utility scripts
│   ├── verify-production.sh           # Production verification script
│   ├── test-production-functionality.sh  # Production functionality test script
│   ├── npm-audit-check.sh             # npm vulnerability check
│   └── security-check.sh              # Security check
├── Makefile              # Development tasks
└── README.md             # Project overview
```

## Frontend Structure (Next.js + Amplify)

```
frontend/
├── app/                   # Next.js App Router
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   ├── globals.css       # Global styles
│   └── favicon.ico       # Favicon
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── lib/                   # Utilities and helpers
│   ├── api/              # API calls
│   ├── i18n.ts           # Internationalization
│   └── utils.ts          # Generic utilities
├── types/                 # TypeScript type definitions
│   └── index.ts          # Common type definitions
├── hooks/                 # Custom hooks
├── public/                # Static files
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # E2E tests (Playwright)
│       ├── fixtures/     # Test fixtures
│       ├── pages/        # Page Object Model
│       ├── specs/        # Test specs (by feature)
│       ├── utils/        # Helper functions
│       └── setup/        # Setup files
├── playwright.config.ts  # Playwright configuration
├── .env.local            # Local environment variables
├── .env.development      # Development environment variables
├── .env.production       # Production environment variables
├── amplify.yml           # Amplify build configuration
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

### Frontend Component Organization

```
components/
├── ui/                    # Basic UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── Modal.tsx
├── features/              # Feature-specific components
│   ├── newspaper/
│   │   ├── NewspaperRenderer.tsx
│   │   ├── NewspaperCard.tsx
│   │   └── NewspaperSettings.tsx
│   ├── feed/
│   │   ├── FeedSelector.tsx
│   │   ├── FeedList.tsx
│   │   └── ThemeInput.tsx
│   └── home/
│       ├── UnifiedHome.tsx
│       └── PopularNewspapers.tsx
└── layouts/               # Layout components
    ├── Header.tsx
    ├── Footer.tsx
    └── Container.tsx
```

## Backend Structure (Lambda + Hono)

```
backend/
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── api.ts        # Main API handler
│   │   └── cron.ts       # Scheduled execution handler
│   ├── routes/            # Hono route definitions
│   │   ├── newspapers.ts # Newspaper-related routes
│   │   ├── feeds.ts      # Feed-related routes
│   │   └── index.ts      # Route aggregation
│   ├── services/          # Business logic
│   │   ├── newspaperService.ts
│   │   ├── feedService.ts
│   │   └── rssParserService.ts
│   ├── repositories/      # Data access layer
│   │   ├── newspaperRepository.ts
│   │   └── feedRepository.ts
│   ├── models/            # Data models and type definitions
│   │   ├── newspaper.ts
│   │   ├── feed.ts
│   │   └── article.ts
│   ├── middleware/        # Hono middleware
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   └── cors.ts
│   └── utils/             # Utility functions
│       ├── logger.ts
│       └── validation.ts
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── infrastructure/        # IaC code
│   ├── cdk/              # AWS CDK
│   │   ├── lib/
│   │   └── bin/
│   └── sam/              # AWS SAM (alternative)
├── .env.development      # Development environment variables
├── .env.production       # Production environment variables
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## Infrastructure Structure (Terraform)

```
infra/
├── environments/          # Environment-specific configuration
│   └── production/       # Production environment
│       ├── main.tf       # Main configuration
│       ├── variables.tf  # Variable definitions
│       ├── outputs.tf    # Output definitions
│       └── terraform.tfvars  # Environment-specific values
└── modules/               # Reusable modules
    ├── amplify/          # Amplify Hosting
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── lambda/           # Lambda functions
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── api-gateway/      # API Gateway
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── dynamodb/         # DynamoDB
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── bedrock/          # Bedrock configuration
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

### Infrastructure Best Practices

- Currently production environment only
- Development and staging environments planned for future
- Abstract common resources with modules
- Add `terraform.tfvars` to `.gitignore` (if containing sensitive information)
- Manage state with remote backend (S3 + DynamoDB)
- Manage environment variables with `terraform.tfvars`

## Shared Types

Manage type definitions shared between frontend and backend as follows:

```
shared/
└── types/
    ├── newspaper.ts      # Newspaper-related types
    ├── feed.ts           # Feed-related types
    ├── article.ts        # Article-related types
    └── api.ts            # API response types
```

Alternatively, consider importing backend type definitions from frontend.

## File Naming Conventions

- **Component files**: PascalCase (e.g., `NewspaperCard.tsx`)
- **Utility files**: camelCase (e.g., `formatDate.ts`)
- **Test files**: `*.test.ts` or `*.spec.ts`
- **Type definition files**: camelCase (e.g., `newspaper.ts`)
- **Configuration files**: kebab-case (e.g., `next.config.ts`)

## Import Path Aliases

Use TypeScript path aliases to simplify imports:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"]
    }
  }
}
```

Usage example:
```typescript
import { NewspaperCard } from '@/components/features/newspaper/NewspaperCard';
import { useTranslations } from '@/lib/i18n';
import type { Newspaper } from '@/types';
```

## E2E Test Structure (Playwright)

### Detailed Directory Structure

```
frontend/tests/e2e/
├── fixtures/              # Test fixtures
│   ├── auth.ts           # Authentication fixtures
│   └── test-data.ts      # Test data (feed URLs, themes, etc.)
├── pages/                 # Page Object Model
│   ├── HomePage.ts       # Home page POM
│   ├── NewspaperPage.ts  # Newspaper page POM
│   └── FeedSelectorPage.ts  # Feed selector page POM
├── specs/                 # Test specs (organized by feature)
│   ├── newspaper/        # Newspaper feature tests
│   │   ├── create-newspaper.spec.ts
│   │   ├── view-newspaper.spec.ts
│   │   └── share-newspaper.spec.ts
│   ├── feed/             # Feed feature tests
│   │   ├── select-feeds.spec.ts
│   │   └── suggest-feeds.spec.ts
│   └── home/             # Home screen tests
│       ├── popular-newspapers.spec.ts
│       └── recent-newspapers.spec.ts
├── utils/                 # Helper functions
│   ├── api-helpers.ts    # API call helpers
│   └── test-helpers.ts   # Generic test helpers
└── setup/                 # Setup files
    ├── global-setup.ts   # Global setup
    └── global-teardown.ts  # Global teardown
```

### File Naming Conventions

- **Page Object**: PascalCase (e.g., `HomePage.ts`)
- **Test specs**: kebab-case + `.spec.ts` (e.g., `create-newspaper.spec.ts`)
- **Fixtures**: kebab-case (e.g., `test-data.ts`)
- **Helpers**: kebab-case (e.g., `api-helpers.ts`)

### Test Organization Policy

1. **Split directories by feature**: Organize under `specs/` by feature
2. **Leverage Page Object Model**: Create POM class per page
3. **Common logic in helpers**: Place reusable logic in `utils/`
4. **Externalize test data**: Manage with fixtures to increase reusability

### Best Practices

- Make each test spec independently executable
- Minimize test dependencies
- Centrally manage element selectors with Page Objects
- Don't hardcode test data, load from fixtures
- Set appropriate timeouts for async processing

## Documentation Location

- **Project Standards**: `.kiro/steering/project-standards.md`
- **Technical Architecture and Coding Conventions**: `.kiro/steering/tech.md`
- **Project Structure**: `.kiro/steering/structure.md` (this file)
- **Feature Specifications**: 
  - Phase 1 (MVP): `.kiro/specs/phase-1/`
  - Phase 2 (Extended features): `.kiro/specs/phase-2/`
