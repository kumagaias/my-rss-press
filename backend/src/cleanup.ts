/**
 * Cleanup Lambda Handler
 * Scheduled to run daily at 3 AM JST (6 PM UTC previous day)
 */

import { cleanupOldNewspapers } from './services/cleanupService.js';

export const handler = async (): Promise<{ statusCode: number; body: string }> => {
  console.log('Cleanup Lambda triggered');

  try {
    const result = await cleanupOldNewspapers();

    console.log(`Cleanup successful: ${result.deletedCount} newspapers deleted`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cleanup successful',
        deletedCount: result.deletedCount,
      }),
    };
  } catch (error) {
    console.error('Cleanup failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Cleanup failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
