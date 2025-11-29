import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = Number(process.env.PORT) || 3001;

console.log(`🚀 Server starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running at http://localhost:${port}`);
console.log(`📊 Health check: http://localhost:${port}/api/health`);
