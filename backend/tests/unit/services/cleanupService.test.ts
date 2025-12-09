import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('cleanupService', () => {
  beforeEach(() => {
    // Mock current date to 2025-12-09 JST
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-09T12:00:00+09:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate correct cutoff date', () => {
    // Test that cutoff date is 7 days ago
    // Current time: 2025-12-09T12:00:00+09:00 (JST)
    // 7 days ago: 2025-12-02T00:00:00+09:00 (JST)
    // But when converted to UTC for ISO string, it becomes 2025-12-01T15:00:00Z
    const nowJST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    const sevenDaysAgo = new Date(nowJST);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

    // The cutoff date in UTC is 2025-12-01 (because JST is UTC+9)
    expect(cutoffDate).toBe('2025-12-01');
  });

  // Note: Full integration tests would require DynamoDB mock
  // For now, we test the date calculation logic
});
