import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { rateLimit } from './middleware/rateLimit.js';

export const app = new Hono();

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

// 3. Rate limiting (100 requests per minute)
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
    }
  });
});
