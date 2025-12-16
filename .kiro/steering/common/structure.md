# Common Project Structure (General)

This document describes general project structure patterns applicable to various projects.

---

## Monorepo Structure

### Basic Layout

```
project-root/
├── frontend/              # Frontend application
├── backend/               # Backend application
├── infra/                 # Infrastructure as Code
├── .kiro/                 # Kiro configuration
│   ├── specs/            # Feature specifications
│   ├── steering/         # Development guidelines
│   └── hooks/            # Agent hooks
├── scripts/              # Utility scripts
├── Makefile              # Development tasks
└── README.md             # Project overview
```

## Frontend Structure (Next.js/React)

```
frontend/
├── app/                   # Next.js App Router (or pages/)
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── lib/                   # Utilities and helpers
│   ├── api/              # API calls
│   └── utils.ts          # Generic utilities
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom hooks
├── public/                # Static files
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # E2E tests
└── package.json          # Dependencies
```

### Component Organization

```
components/
├── ui/                    # Basic UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
├── features/              # Feature-specific components
│   └── [feature-name]/
│       ├── Component1.tsx
│       └── Component2.tsx
└── layouts/               # Layout components
    ├── Header.tsx
    └── Footer.tsx
```

## Backend Structure (Node.js/Lambda)

```
backend/
├── src/
│   ├── handlers/          # Entry points (Lambda handlers, etc.)
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic
│   ├── repositories/      # Data access layer
│   ├── models/            # Data models and types
│   ├── middleware/        # Middleware functions
│   └── utils/             # Utility functions
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
└── package.json          # Dependencies
```

### Layered Architecture

```
Routes → Services → Repositories → Database
```

## Infrastructure Structure (Terraform)

```
infra/
├── environments/          # Environment-specific config
│   ├── development/
│   ├── staging/
│   └── production/
└── modules/               # Reusable modules
    ├── compute/
    ├── database/
    └── networking/
```

## E2E Test Structure (Playwright)

```
tests/e2e/
├── fixtures/              # Test fixtures
├── pages/                 # Page Object Model
├── specs/                 # Test specs (by feature)
├── utils/                 # Helper functions
└── setup/                 # Setup files
```

## File Naming Conventions

- **Component files**: PascalCase (e.g., `UserProfile.tsx`)
- **Utility files**: camelCase (e.g., `formatDate.ts`)
- **Test files**: `*.test.ts` or `*.spec.ts`
- **Type definition files**: camelCase (e.g., `user.ts`)
- **Configuration files**: kebab-case (e.g., `next.config.ts`)

## Import Path Aliases

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

## Documentation Structure

```
.kiro/steering/
├── common-structure.md    # This file (general patterns)
├── common-tech.md         # General tech practices
├── common-project.md      # General project standards
├── structure.md           # Project-specific structure
├── tech.md                # Project-specific tech details
├── project.md             # Project-specific standards
├── product.md             # Product specifications
├── review.md              # Code review guide
└── postmortem.md          # Postmortem guidelines
```

## Best Practices

### File Organization
- One component per file
- Group related files in folders
- Use index.ts for exports
- Keep files under 300 lines

### Separation of Concerns
- **Presentation**: UI only
- **Container**: Logic and data fetching
- **Hooks**: Reusable logic
- **Utils**: Generic helpers

### Test Organization
- Place tests near source files
- Use Page Object Model for E2E tests
- Organize specs by feature
- Externalize test data to fixtures
