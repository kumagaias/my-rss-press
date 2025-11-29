# MyRSSPress Frontend

Next.js 15.x frontend application for MyRSSPress - Your Personalized Morning Digest, Curated by AI.

## Tech Stack

- **Framework**: Next.js 15.x (App Router)
- **Runtime**: Node.js 24.x LTS or 22.x LTS
- **Language**: TypeScript 5.9.x
- **Styling**: TailwindCSS 3.x
- **Testing**: Vitest (unit), Playwright (E2E)
- **UI Development**: Storybook 8.x

## Getting Started

### Prerequisites

- Node.js 24.x LTS (Active LTS) or 22.x LTS (Maintenance LTS)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Testing

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# Show E2E test report
npm run test:e2e:report
```

### Storybook

```bash
# Start Storybook (http://localhost:6006)
npm run storybook

# Build Storybook
npm run build-storybook
```

## Project Structure

```
frontend/
├── app/                   # Next.js App Router
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── ui/               # Basic UI components
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── lib/                   # Utilities and helpers
│   ├── api/              # API client functions
│   ├── i18n.ts           # Internationalization
│   └── utils.ts          # Utility functions
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── public/                # Static assets
└── tests/                 # Test files
    ├── unit/             # Unit tests
    ├── integration/      # Integration tests
    └── e2e/              # E2E tests (Playwright)
```

## Internationalization (i18n)

The application supports Japanese (ja) and English (en) languages. Language is automatically detected from browser settings.

### Usage

```typescript
import { detectLocale, useTranslations } from '@/lib/i18n';

const locale = detectLocale(); // 'ja' or 'en'
const t = useTranslations(locale);

console.log(t.appName); // 'MyRSSPress'
console.log(t.appTagline); // Localized tagline
```

## Environment Variables

Create a `.env.local` file (not tracked by git):

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Environment
NEXT_PUBLIC_APP_ENV=development
```

## Path Aliases

The following path aliases are configured:

- `@/*` - Root directory
- `@/components/*` - Components directory
- `@/lib/*` - Library directory
- `@/types/*` - Types directory
- `@/hooks/*` - Hooks directory

## Design System

### Colors

- **Primary**: Blue shades for main actions
- **Newspaper**: Beige/brown tones for newspaper theme
- **Semantic**: Success, warning, error, info colors

### Typography

- **Sans**: Inter, system-ui (UI elements)
- **Serif**: Georgia, Times New Roman (newspaper content)
- **Mono**: Fira Code (code blocks)

## Contributing

1. Create a feature branch: `git checkout -b feat/task-X.X-description`
2. Make your changes
3. Run tests: `npm test`
4. Commit: `git commit -m "feat: description (task-X.X)"`
5. Push: `git push origin feat/task-X.X-description`
6. Create a Pull Request

## License

Private project - All rights reserved
