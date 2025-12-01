import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { suggestFeeds } from '../../../src/services/bedrockService.js';

describe('Bedrock Service', () => {
  const originalEnv = process.env.USE_BEDROCK_MOCK;

  beforeEach(() => {
    // Enable mock mode for tests
    process.env.USE_BEDROCK_MOCK = 'true';
  });

  afterEach(() => {
    // Restore original environment
    process.env.USE_BEDROCK_MOCK = originalEnv;
  });

  it('should return feed suggestions for a given theme', async () => {
    const theme = 'Technology';
    const suggestions = await suggestFeeds(theme);

    expect(suggestions).toBeDefined();
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  it('should return suggestions with required fields', async () => {
    const theme = 'Sports';
    const suggestions = await suggestFeeds(theme);

    suggestions.forEach(suggestion => {
      expect(suggestion).toHaveProperty('url');
      expect(suggestion).toHaveProperty('title');
      expect(suggestion).toHaveProperty('reasoning');
      expect(typeof suggestion.url).toBe('string');
      expect(typeof suggestion.title).toBe('string');
      expect(typeof suggestion.reasoning).toBe('string');
    });
  });

  it('should include theme in reasoning', async () => {
    const theme = 'Music';
    const suggestions = await suggestFeeds(theme);

    const hasThemeInReasoning = suggestions.some(s => 
      s.reasoning.includes(theme)
    );
    expect(hasThemeInReasoning).toBe(true);
  });
});
