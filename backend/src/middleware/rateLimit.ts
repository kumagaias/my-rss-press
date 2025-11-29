import type { Context, Next } from 'hono';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// IPアドレスごとのリクエストカウントを保存
const requestCounts = new Map<string, RateLimitRecord>();

/**
 * レート制限ミドルウェア
 * @param maxRequests - 時間枠内の最大リクエスト数
 * @param windowMs - 時間枠（ミリ秒）
 * @returns Honoミドルウェア関数
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    // クライアントのIPアドレスを取得
    const ip = 
      c.req.header('x-forwarded-for') || 
      c.req.header('x-real-ip') || 
      'unknown';
    
    const now = Date.now();
    const record = requestCounts.get(ip);
    
    // レコードが存在しないか、時間枠が過ぎている場合は新しいレコードを作成
    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { 
        count: 1, 
        resetTime: now + windowMs 
      });
      return await next();
    }
    
    // リクエストカウントをインクリメント
    record.count++;
    
    // 制限を超えた場合は429エラーを返す
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return c.json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: `${retryAfter} seconds`
      }, 429);
    }
    
    // 制限内の場合は次のミドルウェアへ
    return await next();
  };
};

/**
 * 古いレコードをクリーンアップする関数
 * メモリリークを防ぐため、定期的に実行することを推奨
 */
export const cleanupOldRecords = () => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
};

// 5分ごとに古いレコードをクリーンアップ
setInterval(cleanupOldRecords, 5 * 60 * 1000);
