# Project Structure - MyRSSPress

**Related**: [common-structure.md](./common-structure.md) - General structure patterns

---

## Root Directory

```
myrsspress/
├── frontend/              # Next.js + Amplify
├── backend/               # Lambda + Hono
├── infra/                 # Terraform
├── .kiro/
│   ├── specs/            # Phase 1, 2, 3
│   ├── steering/         # This file
│   └── hooks/
├── scripts/              # Utility scripts
├── Makefile
└── README.md
```

## Frontend (Next.js 15.x)

```
frontend/
├── app/                   # App Router
│   ├── page.tsx          # Home page
│   └── newspaper/        # Newspaper page
├── components/
│   ├── ui/               # Button, Input, Card, etc.
│   ├── features/
│   │   ├── feed/         # FeedSelector, ThemeInput
│   │   ├── newspaper/    # NewspaperRenderer, DateNavigation
│   │   └── home/         # PopularNewspapers, LanguageFilter, SearchInput
│   └── layouts/
├── lib/
│   ├── api/              # API calls
│   ├── i18n.ts           # Translations (en/ja)
│   └── utils.ts
├── types/
│   └── index.ts          # Shared types
└── tests/
    ├── unit/
    └── e2e/              # Playwright tests
```

## Backend (Lambda + Hono)

```
backend/
├── src/
│   ├── routes/
│   │   ├── newspapers.ts # Newspaper CRUD
│   │   └── feeds.ts      # Feed suggestions
│   ├── services/
│   │   ├── bedrockService.ts          # AI suggestions
│   │   ├── rssFetcherService.ts       # RSS parsing
│   │   ├── languageDetectionService.ts # JP/EN detection
│   │   ├── summaryGenerationService.ts # AI summary
│   │   ├── articleFilterService.ts    # Theme relevance filtering
│   │   └── historicalNewspaperService.ts # Date-based newspapers
│   ├── models/
│   │   └── newspaper.ts  # DynamoDB model
│   ├── middleware/
│   │   └── rateLimit.ts
│   ├── app.ts            # Hono app
│   ├── lambda.ts         # Lambda handler
│   ├── dev.ts            # Local dev server
│   └── cleanup.ts        # Cleanup Lambda
└── tests/
    └── unit/
```

## Infrastructure (Terraform)

```
infra/
├── environments/
│   └── production/
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
└── modules/
    ├── amplify/          # Frontend hosting
    ├── lambda/           # Backend functions
    ├── api-gateway/      # API Gateway
    ├── dynamodb/         # Database
    ├── ecr/              # Container registry
    ├── eventbridge/      # Cleanup schedule
    └── secrets-manager/  # Secrets
```

## Specifications

```
.kiro/specs/
├── phase-1/              # MVP (Complete)
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── phase-2/              # Enhanced Features (In Progress)
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
└── phase-3/              # Dynamic Categories (Planned)
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## Key Files

### Frontend
- `app/page.tsx` - Home page (theme input, feed selection, popular newspapers)
- `app/newspaper/page.tsx` - Newspaper display with date navigation
- `lib/i18n.ts` - Translations (Japanese/English)
- `lib/api.ts` - API client functions

### Backend
- `routes/feeds.ts` - POST `/api/suggest-feeds` (AI suggestions)
- `routes/newspapers.ts` - Newspaper CRUD + historical newspapers
- `services/bedrockService.ts` - Claude 3 Haiku integration
- `services/articleFilterService.ts` - Article filtering by theme relevance
- `services/historicalNewspaperService.ts` - Date-based newspaper generation

### Infrastructure
- `infra/environments/production/main.tf` - Main Terraform config
- `infra/modules/lambda/main.tf` - Lambda function definition
- `infra/modules/eventbridge/main.tf` - Cleanup schedule (daily 3 AM JST)

## Import Aliases

```typescript
// Frontend
import { Button } from '@/components/ui/Button';
import { useTranslations } from '@/lib/i18n';
import type { Newspaper } from '@/types';
```

## Documentation

```
.kiro/steering/
├── common-structure.md   # General patterns
├── common-tech.md        # General practices
├── common-project.md     # General standards
├── structure.md          # This file
├── tech.md               # MyRSSPress tech details
├── project.md            # MyRSSPress standards
├── product.md            # Product specs
├── review.md             # Code review guide
└── postmortem.md         # Incident handling
```
