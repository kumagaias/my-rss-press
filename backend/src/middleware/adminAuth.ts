import { Context, Next } from 'hono';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// SSM client
const ssmClient = new SSMClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
});

// Cache for API key (to avoid repeated SSM calls)
let cachedApiKey: string | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get Admin API key from AWS SSM Parameter Store
 * @returns Admin API key
 */
async function getAdminApiKey(): Promise<string> {
  // Return cached key if still valid
  if (cachedApiKey && Date.now() < cacheExpiry) {
    return cachedApiKey;
  }

  try {
    const paramName = process.env.ADMIN_API_KEY_PARAM_NAME || '/myrsspress/production/admin-api-key';

    const response = await ssmClient.send(
      new GetParameterCommand({
        Name: paramName,
        WithDecryption: true,
      })
    );

    const apiKey = response.Parameter?.Value;

    if (!apiKey) {
      throw new Error('Admin API key not found in SSM Parameter Store');
    }

    // Cache the key
    cachedApiKey = apiKey;
    cacheExpiry = Date.now() + CACHE_TTL;

    return apiKey;
  } catch (error) {
    console.error('Error fetching Admin API key from SSM Parameter Store:', error);
    throw new Error('Failed to authenticate: Unable to retrieve API key');
  }
}

/**
 * Admin API authentication middleware
 * Validates X-API-Key header against the key stored in AWS SSM Parameter Store
 */
export async function adminAuth(c: Context, next: Next): Promise<Response> {
  try {
    // Get API key from request header
    const requestApiKey = c.req.header('X-API-Key');

    if (!requestApiKey) {
      return c.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Missing X-API-Key header',
        },
        401
      );
    }

    // Get expected API key from SSM Parameter Store
    const expectedApiKey = await getAdminApiKey();

    // Compare API keys (constant-time comparison to prevent timing attacks)
    if (!constantTimeCompare(requestApiKey, expectedApiKey)) {
      return c.json(
        {
          error: 'FORBIDDEN',
          message: 'Invalid API key',
        },
        403
      );
    }

    // Authentication successful, proceed to next middleware/handler
    await next();
    return c.res;
  } catch (error) {
    console.error('Admin authentication error:', error);
    return c.json(
      {
        error: 'AUTHENTICATION_ERROR',
        message: error instanceof Error ? error.message : 'Authentication failed',
      },
      500
    );
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
