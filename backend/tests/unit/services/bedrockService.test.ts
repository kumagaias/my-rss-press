import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// IMPORTANT: Set mock mode BEFORE importing any modules
const originalEnv = process.env.USE_BEDROCK_MOCK;
process.env.USE_BEDROCK_MOCK = 'true';

// Now import the service (config will read USE_BEDROCK_MOCK='true')
import { suggestFeeds } from '../../../src/services/bedrockService.js';

describe('Bedrock Service', () => {
  afterAll(() => {
    // Restore original environment
    process.env.USE_BEDROCK_MOCK = originalEnv;
  });

  it('should return feed suggestions for a given theme', async () => {
    console.log('TEST: USE_BEDROCK_MOCK =', process.env.USE_BEDROCK_MOCK);
    const theme = 'Technology';
    console.log('TEST: Calling suggestFeeds with theme:', theme);
    const result = await suggestFeeds(theme);
    console.log('TEST: Got result:', result);

    expect(result).toBeDefined();
    expect(result).toHaveProperty('feeds');
    expect(result).toHaveProperty('newspaperName');
    expect(Array.isArray(result.feeds)).toBe(true);
    expect(result.feeds.length).toBeGreaterThan(0);
    expect(result.feeds.length).toBeLessThanOrEqual(15);
    expect(typeof result.newspaperName).toBe('string');
  }, 10000); // Increase timeout to 10s

  it('should return suggestions with required fields', async () => {
    const theme = 'Sports';
    const result = await suggestFeeds(theme);

    result.feeds.forEach(suggestion => {
      expect(suggestion).toHaveProperty('url');
      expect(suggestion).toHaveProperty('title');
      expect(suggestion).toHaveProperty('reasoning');
      expect(typeof suggestion.url).toBe('string');
      expect(typeof suggestion.title).toBe('string');
      expect(typeof suggestion.reasoning).toBe('string');
    });
  }, 10000); // Increase timeout to 10s

  it('should include theme in reasoning', async () => {
    const theme = 'Music';
    const result = await suggestFeeds(theme);

    const hasThemeInReasoning = result.feeds.some(s => 
      s.reasoning.includes(theme)
    );
    expect(hasThemeInReasoning).toBe(true);
  }, 10000); // Increase timeout to 10s
});
