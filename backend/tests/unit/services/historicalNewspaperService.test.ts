import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateDate } from '../../../src/services/historicalNewspaperService.js';

describe('historicalNewspaperService', () => {
  describe('validateDate', () => {
    beforeEach(() => {
      // Mock current date to 2025-12-09 JST
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-09T12:00:00+09:00'));
    });

    it('should accept today\'s date', () => {
      const result = validateDate('2025-12-09');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept date within 7 days', () => {
      const result = validateDate('2025-12-05'); // 4 days ago
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept date exactly 7 days ago', () => {
      const result = validateDate('2025-12-02'); // Exactly 7 days ago
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject future date', () => {
      const result = validateDate('2025-12-10'); // Tomorrow
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Future newspapers are not available');
    });

    it('should reject date older than 7 days', () => {
      const result = validateDate('2025-12-01'); // 8 days ago
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Newspapers older than 7 days are not available');
    });

    it('should reject invalid date format', () => {
      const result = validateDate('invalid-date');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('should reject empty date', () => {
      const result = validateDate('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });

    it('should handle date with wrong format', () => {
      const result = validateDate('12/09/2025'); // MM/DD/YYYY format
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid date format. Use YYYY-MM-DD');
    });
  });
});
