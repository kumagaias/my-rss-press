import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { rateLimit } from '../../../src/middleware/rateLimit.js';

describe('Rate Limit Middleware', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    // 10リクエスト/秒の制限でテスト
    app.use('/api/*', rateLimit(10, 1000));
    app.get('/api/test', (c) => c.json({ success: true }));
  });

  it('制限内のリクエストは許可される', async () => {
    // 10回のリクエストを送信
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ success: true });
    }
  });

  it('制限を超えると429エラーが返される', async () => {
    // 11回のリクエストを送信（制限は10）
    for (let i = 0; i < 10; i++) {
      await app.request('/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.2' }
      });
    }

    // 11回目のリクエスト
    const res = await app.request('/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.2' }
    });
    
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Too many requests');
  });

  it('異なるIPアドレスは独立してカウントされる', async () => {
    // IP1から10回
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.3' }
      });
      expect(res.status).toBe(200);
    }

    // IP2から10回（独立してカウントされるので成功するはず）
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.4' }
      });
      expect(res.status).toBe(200);
    }
  });

  it('時間枠が過ぎるとカウントがリセットされる', async () => {
    // 10回のリクエストを送信
    for (let i = 0; i < 10; i++) {
      await app.request('/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.5' }
      });
    }

    // 11回目は失敗するはず
    let res = await app.request('/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.5' }
    });
    expect(res.status).toBe(429);

    // 1秒待機（時間枠が過ぎる）
    await new Promise(resolve => setTimeout(resolve, 1100));

    // 時間枠が過ぎたので成功するはず
    res = await app.request('/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.5' }
    });
    expect(res.status).toBe(200);
  });

  it('IPアドレスが取得できない場合はunknownとして扱う', async () => {
    // ヘッダーなしでリクエスト
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/api/test');
      expect(res.status).toBe(200);
    }

    // 11回目は失敗するはず
    const res = await app.request('/api/test');
    expect(res.status).toBe(429);
  });
});
