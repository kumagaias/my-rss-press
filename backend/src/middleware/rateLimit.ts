import type { Context, Next } from 'hono';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Store request counts per IP address
const requestCounts = new Map<string, RateLimitRecord>();

/**
 * Rate limiting middleware
 * @param maxRequests - Maximum number of requests within the time window
 * @param windowMs - Time window in milliseconds
 * @returns Hono middleware function
 */
export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (c: Context, next: Next): Promise<Response | void> => {
    // Get client IP address
    const ip = 
      c.req.header('x-forwarded-for') || 
      c.req.header('x-real-ip') || 
      'unknown';
    
    const now = Date.now();
    const record = requestCounts.get(ip);
    
    // Create a new record if it doesn't exist or the time window has passed
    if (!record || now > record.resetTime) {
      requestCounts.set(ip, { 
        count: 1, 
        resetTime: now + windowMs 
      });
      return await next();
    }
    
    // Increment request count
    record.count++;
    
    // Return 429 error if limit is exceeded
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return c.json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: `${retryAfter} seconds`
      }, 429);
    }
    
    // Proceed to next middleware if within limit
    return await next();
  };
};

/**
 * Clean up old records
 * Recommended to run periodically to prevent memory leaks
 */
export const cleanupOldRecords = () => {
  const now = Date.now();
  for (const [ip, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(ip);
    }
  }
};

// Clean up old records every 5 minutes
setInterval(cleanupOldRecords, 5 * 60 * 1000);
