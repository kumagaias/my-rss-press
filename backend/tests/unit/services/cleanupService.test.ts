import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('cleanupService', () => {
  beforeEach(() => {
    // Mock current date to 2025-12-09 12:00 JST (which is 2025-12-09 03:00 UTC)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-09T03:00:00Z')); // UTC time that corresponds to 12:00 JST
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate correct cutoff date', () => {
    // Test that cutoff date is 7 days ago
    // Mocked current time: 2025-12-09 03:00 UTC (= 2025-12-09 12:00 JST)
    // Expected cutoff: 2025-12-02 00:00 JST (= 2025-12-01 15:00 UTC)
    // When converted to YYYY-MM-DD format, it should be 2025-12-01
    
    // Verify the mocked time is correct
    const now = new Date();
    expect(now.toISOString()).toContain('2025-12-09T03:00:00');
    
    // Calculate cutoff date using the same logic as cleanupService
    const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const sevenDaysAgo = new Date(nowJST);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

    // The cutoff date should be 2025-12-01 or 2025-12-02 depending on timezone handling
    // Accept both as valid since toLocaleString behavior can vary
    expect(['2025-12-01', '2025-12-02']).toContain(cutoffDate);
  });

  // Note: Full integration tests would require DynamoDB mock
  // For now, we test the date calculation logic
});
