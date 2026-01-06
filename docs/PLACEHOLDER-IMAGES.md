# Placeholder Images Guide

## Overview

MyRSSPress uses category-based placeholder images for articles without images. This ensures every article has a visually appealing header image that matches its content.

## Directory Structure

```
frontend/public/images/placeholders/
├── technology.jpg
├── business.jpg
├── sports.jpg
├── entertainment.jpg
├── science.jpg
├── health.jpg
├── politics.jpg
├── world.jpg
├── lifestyle.jpg
├── food.jpg
└── general.jpg
```

Total: **11 images** (1 per category)

## Image Specifications

- **Size**: 1024x1024px (square format)
- **Format**: JPEG or PNG
- **Quality**: Good quality for web
- **File size**: Target ~200-400KB per image
- **Style**: Professional newspaper header aesthetic
- **Copyright**: Commercial use allowed, royalty-free

## Categories and Keywords

### Technology
Keywords: tech, technology, software, hardware, ai, computer, digital, internet, cyber, innovation

### Business
Keywords: business, economy, finance, market, stock, trade, corporate, startup, investment, entrepreneur

### Sports
Keywords: sports, football, soccer, basketball, baseball, tennis, golf, olympics, athlete, game

### Entertainment
Keywords: entertainment, movie, film, music, celebrity, tv, show, concert, theater, arts

### Science
Keywords: science, research, study, discovery, space, astronomy, physics, chemistry, biology, lab

### Health
Keywords: health, medical, medicine, doctor, hospital, wellness, fitness, nutrition, disease, treatment

### Politics
Keywords: politics, government, election, policy, law, congress, senate, parliament, vote, legislation

### World
Keywords: world, international, global, foreign, country, nation, diplomatic, embassy, united nations

### Lifestyle
Keywords: lifestyle, living, home, fashion, design, travel, culture, hobby, leisure, style

### Food
Keywords: food, restaurant, cooking, recipe, chef, cuisine, dining, culinary, meal, dish

### General
Fallback category for articles that don't match other categories

## Usage in Code

```typescript
import { getPlaceholderImage } from '@/lib/placeholderImages';

// Get placeholder image for an article
const placeholderUrl = getPlaceholderImage(
  article.title,
  article.description
);

// Use in component
<img src={placeholderUrl} alt={article.title} />
```

## Integration Points

### 1. NewspaperLayout Component
When rendering articles without images, use placeholder images:

```typescript
const imageUrl = article.imageUrl || getPlaceholderImage(article.title, article.description);
```

### 2. Article Cards
For article previews in lists:

```typescript
<img 
  src={article.imageUrl || getPlaceholderImage(article.title)} 
  alt={article.title}
/>
```

### 3. Lead Article
Ensure lead article always has an image:

```typescript
const leadImage = leadArticle.imageUrl || getPlaceholderImage(
  leadArticle.title,
  leadArticle.description
);
```

## Performance Optimization

### Preloading
Preload placeholder images on app initialization:

```typescript
import { preloadPlaceholderImages } from '@/lib/placeholderImages';

// In _app.tsx or layout.tsx
useEffect(() => {
  preloadPlaceholderImages();
}, []);
```

### Next.js Image Optimization
Use Next.js Image component for automatic optimization:

```typescript
import Image from 'next/image';

<Image
  src={placeholderUrl}
  alt={article.title}
  width={1024}
  height={1024}
  priority={isLeadArticle}
/>
```

## Image Generation Checklist

When generating new placeholder images:

- [ ] Size: 1024x1024px (square format)
- [ ] Format: JPEG or PNG
- [ ] Good quality for web display
- [ ] No text or logos
- [ ] No recognizable brands
- [ ] Professional aesthetic
- [ ] Suitable for newspaper
- [ ] Optimized file size (~200-400KB)
- [ ] Saved in placeholders folder
- [ ] Named correctly (technology.jpg, business.jpg, etc.)

## Testing

Test placeholder image selection:

```bash
# Frontend tests
cd frontend
npm test -- placeholderImages.test.ts
```

## Future Enhancements

- [ ] Add more categories (e.g., environment, education, automotive)
- [ ] Add multiple variations per category (2-3 images)
- [ ] Add seasonal variations
- [ ] Implement smart caching strategy
- [ ] Add WebP format support for better compression
- [ ] Create responsive image sets for different screen sizes
