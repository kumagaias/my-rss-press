import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { rateLimit } from './middleware/rateLimit.js';

export const app = new Hono();

// ミドルウェア設定
// 1. ログ記録
app.use('*', logger());

// 2. CORS設定
app.use('*', cors({
  origin: [
    'https://my-rss-press.com',
    'https://www.my-rss-press.com',
    // 開発環境
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean),
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24時間
}));

// 3. レート制限（100リクエスト/分）
app.use('/api/*', rateLimit(100, 60000));

// ヘルスチェックエンドポイント
app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

// ルートエンドポイント
app.get('/', (c) => {
  return c.json({ 
    message: 'MyRSSPress API',
    version: '0.1.0',
    endpoints: {
      health: '/api/health',
    }
  });
});
