# React/Next.js Best Practices

React and Next.js specific patterns and best practices.

---

## Component Patterns

### Functional Components
- Use functional components with hooks
- Follow Container/Presentational pattern
- Separate business logic from UI

```typescript
// ✅ Good: Presentational component
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ✅ Good: Container component
export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingSpinner />;
  if (!user) return <ErrorMessage />;
  
  return <UserCard user={user} />;
}
```

## Hooks Best Practices

### useState
```typescript
// ✅ Good: Explicit type
const [user, setUser] = useState<User | null>(null);

// ✅ Good: Functional update
setCount(prev => prev + 1);

// ❌ Bad: Direct state mutation
user.name = 'New Name'; // Don't mutate state directly
```

### useEffect
```typescript
// ✅ Good: Include all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ Good: Cleanup function
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);

// ❌ Bad: Missing dependencies
useEffect(() => {
  fetchData(userId);
}, []); // userId should be in dependencies
```

### useCallback
```typescript
// ✅ Good: Memoize callback passed to child
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);

return <Button onClick={handleClick} />;
```

### useMemo
```typescript
// ✅ Good: Memoize expensive calculation
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ Good: Memoize object/array to prevent re-renders
const config = useMemo(() => ({ theme, locale }), [theme, locale]);
```

## Performance Optimization

### React.memo
```typescript
// ✅ Good: Prevent unnecessary re-renders
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  return <div>{/* expensive rendering */}</div>;
});
```

### Code Splitting
```typescript
// ✅ Good: Dynamic import
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
});
```

## Next.js Specific

### App Router (Next.js 15+)
```typescript
// app/page.tsx - Server Component by default
export default function HomePage() {
  return <div>Home</div>;
}

// app/client-component.tsx - Client Component
'use client';

export default function ClientComponent() {
  const [state, setState] = useState(0);
  return <button onClick={() => setState(s => s + 1)}>{state}</button>;
}
```

### Data Fetching
```typescript
// ✅ Good: Server Component data fetching
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// ✅ Good: Client Component data fetching
'use client';

export default function Page() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return <div>{data}</div>;
}
```

### Image Optimization
```typescript
// ✅ Good: Use Next.js Image
import Image from 'next/image';

<Image
  src="/photo.jpg"
  alt="Photo"
  width={500}
  height={300}
  priority
/>

// ❌ Bad: Regular img tag
<img src="/photo.jpg" alt="Photo" />
```

## Internationalization (i18n)

```typescript
// ❌ Bad: Hardcoded text
<button>Save</button>

// ✅ Good: Use translation
import { useTranslations } from '@/lib/i18n';

const t = useTranslations(locale);
<button>{t.save}</button>
```

## Accessibility

```typescript
// ✅ Good: Proper ARIA labels
<button aria-label="Close dialog" onClick={onClose}>
  <CloseIcon />
</button>

// ✅ Good: Alt text for images
<img src={url} alt={title || 'Default description'} />

// ✅ Good: Semantic HTML
<nav>
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>
```

## Testing

```typescript
// ✅ Good: React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';

test('button click increments counter', () => {
  render(<Counter />);
  const button = screen.getByRole('button');
  fireEvent.click(button);
  expect(screen.getByText('1')).toBeInTheDocument();
});
```
