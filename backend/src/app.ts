import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { rateLimit } from './middleware/rateLimit.js';
import { feedsRouter } from './routes/feeds.js';
import { newspapersRouter } from './routes/newspapers.js';
import adminCategoriesRouter from './routes/admin/categories.js';
import { preloadCategoryCache } from './services/categoryCache.js';

export const app = new Hono();

// Pre-load category cache on application startup
preloadCategoryCache().catch((error) => {
  console.error('Failed to pre-load category cache on startup:', error);
});

// Middleware configuration
// 1. Logging
app.use('*', logger());

// 2. CORS configuration
app.use('*', cors({
  origin: [
    'https://my-rss-press.com',
    'https://www.my-rss-press.com',
    // Development environment
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean),
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));

// 3. Rate limiting (100 requests per minute for general endpoints)
app.use('/api/*', rateLimit(100, 60000));

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'MyRSSPress API',
    version: '0.1.0',
    endpoints: {
      health: '/api/health',
      suggestFeeds: 'POST /api/suggest-feeds',
      generateNewspaper: 'POST /api/generate-newspaper',
      saveNewspaper: 'POST /api/newspapers',
      getNewspaper: 'GET /api/newspapers/:id',
      getPublicNewspapers: 'GET /api/newspapers?sort=popular&limit=10',
    }
  });
});

// Mount routers
app.route('/api', feedsRouter);
app.route('/api', newspapersRouter);
app.route('/api/admin/categories', adminCategoriesRouter);
