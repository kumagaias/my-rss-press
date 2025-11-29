import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { detectLocale, useTranslations, formatDate, formatNumber } from './i18n';
import type { Locale } from './i18n';

describe('i18n', () => {
  describe('detectLocale', () => {
    let originalNavigator: Navigator;

    beforeEach(() => {
      originalNavigator = global.navigator;
    });

    afterEach(() => {
      global.navigator = originalNavigator;
    });

    it('should return "ja" when browser language starts with "ja"', () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'ja-JP',
        configurable: true,
      });

      expect(detectLocale()).toBe('ja');
    });

    it('should return "ja" for "ja" language code', () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'ja',
        configurable: true,
      });

      expect(detectLocale()).toBe('ja');
    });

    it('should return "en" when browser language is English', () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'en-US',
        configurable: true,
      });

      expect(detectLocale()).toBe('en');
    });

    it('should return "en" for non-Japanese languages', () => {
      Object.defineProperty(global.navigator, 'language', {
        value: 'fr-FR',
        configurable: true,
      });

      expect(detectLocale()).toBe('en');
    });
  });

  describe('useTranslations', () => {
    it('should return English translations for "en" locale', () => {
      const t = useTranslations('en');
      
      expect(t.appName).toBe('MyRSSPress');
      expect(t.appTagline).toBe('Your Personalized Morning Digest, Curated by AI');
      expect(t.home).toBe('Home');
    });

    it('should return Japanese translations for "ja" locale', () => {
      const t = useTranslations('ja');
      
      expect(t.appName).toBe('MyRSSPress');
      expect(t.appTagline).toBe('AIがキュレートする、あなた専用の朝刊');
      expect(t.home).toBe('ホーム');
    });

    it('should have all required translation keys for both locales', () => {
      const enKeys = Object.keys(useTranslations('en'));
      const jaKeys = Object.keys(useTranslations('ja'));
      
      expect(enKeys).toEqual(jaKeys);
    });
  });

  describe('formatDate', () => {
    it('should format date in English locale', () => {
      const date = new Date('2025-11-29T10:00:00Z');
      const formatted = formatDate(date, 'en');
      
      // The exact format may vary by environment, but it should contain the date components
      expect(formatted).toContain('2025');
      expect(formatted).toContain('29');
    });

    it('should format date in Japanese locale', () => {
      const date = new Date('2025-11-29T10:00:00Z');
      const formatted = formatDate(date, 'ja');
      
      // The exact format may vary by environment, but it should contain the date components
      expect(formatted).toContain('2025');
      expect(formatted).toContain('29');
    });

    it('should handle string dates', () => {
      const dateString = '2025-11-29T10:00:00Z';
      const formatted = formatDate(dateString, 'en');
      
      expect(formatted).toContain('2025');
      expect(formatted).toContain('29');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers in English locale', () => {
      expect(formatNumber(1000, 'en')).toBe('1,000');
      expect(formatNumber(1000000, 'en')).toBe('1,000,000');
    });

    it('should format numbers in Japanese locale', () => {
      expect(formatNumber(1000, 'ja')).toBe('1,000');
      expect(formatNumber(1000000, 'ja')).toBe('1,000,000');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(42, 'en')).toBe('42');
      expect(formatNumber(42, 'ja')).toBe('42');
    });
  });
});
