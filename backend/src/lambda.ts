import { app } from './app.js';
import { handle } from 'hono/aws-lambda';

// Lambda関数ハンドラー（API Gateway統合用）
export const handler = handle(app);
