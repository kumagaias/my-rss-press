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
    const suggestions = await suggestFeeds(theme);
    console.log('TEST: Got suggestions:', suggestions);

    expect(suggestions).toBeDefined();
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(10);
  }, 10000); // Increase timeout to 10s

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
  }, 10000); // Increase timeout to 10s

  it('should include theme in reasoning', async () => {
    const theme = 'Music';
    const suggestions = await suggestFeeds(theme);

    const hasThemeInReasoning = suggestions.some(s => 
      s.reasoning.includes(theme)
    );
    expect(hasThemeInReasoning).toBe(true);
  }, 10000); // Increase timeout to 10s
});
