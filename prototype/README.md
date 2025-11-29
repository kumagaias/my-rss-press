# MyRSSPress Prototype

A Next.js prototype for MyRSSPress - an application that transforms RSS feeds into visually appealing newspaper-style layouts.

## Features

- Theme input for topic discovery
- AI-powered RSS feed suggestions (dummy data)
- Feed selection interface
- Newspaper-style article layout with paper texture
- Article importance-based sizing
- Bookmark functionality
- PDF export capability (placeholder)

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React

## Project Structure

```
prototype/
├── app/
│   ├── page.tsx          # Main application flow
│   └── layout.tsx        # Root layout
├── components/
│   ├── ThemeInput.tsx    # Theme input component
│   ├── FeedSelector.tsx  # Feed selection component
│   └── NewspaperRenderer.tsx # Newspaper layout component
└── types/
    └── index.ts          # TypeScript type definitions
```

## Notes

This is a prototype using dummy data. The actual implementation will integrate with:
- AWS Bedrock for AI suggestions
- Go/Echo backend for RSS fetching
- DynamoDB for bookmarks
- Real RSS feed parsing
