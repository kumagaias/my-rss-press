/**
 * Unit tests for Configuration Module
 * 
 * Tests the bedrockModelId configuration including:
 * - Default model IDs (Nova Lite and Nova Micro)
 * - Environment variable override
 * - Rollback to Claude 3 Haiku via env var
 * 
 * Requirements: 10.1, 10.6
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Configuration Module', () => {
  // Store original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to ensure fresh config import
    vi.resetModules();
    // Create a fresh copy of process.env
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('bedrockModelIdLite', () => {
    it('should default to Nova Lite model ID when no environment variable is set', async () => {
      // Ensure BEDROCK_MODEL_ID_LITE is not set
      delete process.env.BEDROCK_MODEL_ID_LITE;

      // Import config fresh
      const { config } = await import('../../src/config.js');

      expect(config.bedrockModelIdLite).toBe('apac.amazon.nova-lite-v1:0');
    });

    it('should use environment variable when BEDROCK_MODEL_ID_LITE is set', async () => {
      // Set custom model ID
      process.env.BEDROCK_MODEL_ID_LITE = 'custom-lite-model-id';

      // Import config fresh
      const { config } = await import('../../src/config.js');

      expect(config.bedrockModelIdLite).toBe('custom-lite-model-id');
    });

    it('should support rollback to Claude 3 Haiku via environment variable', async () => {
      // Set Claude 3 Haiku model ID
      process.env.BEDROCK_MODEL_ID_LITE = 'anthropic.claude-3-haiku-20240307-v1:0';

      // Import config fresh
      const { config } = await import('../../src/config.js');

      expect(config.bedrockModelIdLite).toBe('anthropic.claude-3-haiku-20240307-v1:0');
    });

    it('should handle empty string environment variable by using default', async () => {
      // Set empty string (should fall back to default due to || operator)
      process.env.BEDROCK_MODEL_ID_LITE = '';

      // Import config fresh
      const { config } = await import('../../src/config.js');

      expect(config.bedrockModelIdLite).toBe('apac.amazon.nova-lite-v1:0');
    });
  });

  describe('bedrockModelIdMicro', () => {
    it('should default to Nova Micro model ID when no environment variable is set', async () => {
      // Ensure BEDROCK_MODEL_ID_MICRO is not set
      delete process.env.BEDROCK_MODEL_ID_MICRO;

      // Import config fresh
      const { config } = await import('../../src/config.js');

      expect(config.bedrockModelIdMicro).toBe('apac.amazon.nova-micro-v1:0');
    });

    it('should use environment variable when BEDROCK_MODEL_ID_MICRO is set', async () => {
      // Set custom model ID
      process.env.BEDROCK_MODEL_ID_MICRO = 'custom-micro-model-id';

      // Import config fresh
      const { config } = await import('../../src/config.js');

      expect(config.bedrockModelIdMicro).toBe('custom-micro-model-id');
    });

    it('should support rollback to Claude 3 Haiku via environment variable', async () => {
      // Set Claude 3 Haiku model ID
      process.env.BEDROCK_MODEL_ID_MICRO = 'anthropic.claude-3-haiku-20240307-v1:0';

      // Import config fresh
      const { config } = await import('../../src/config.js');

      expect(config.bedrockModelIdMicro).toBe('anthropic.claude-3-haiku-20240307-v1:0');
    });

    it('should handle empty string environment variable by using default', async () => {
      // Set empty string (should fall back to default due to || operator)
      process.env.BEDROCK_MODEL_ID_MICRO = '';

      // Import config fresh
      const { config } = await import('../../src/config.js');

      expect(config.bedrockModelIdMicro).toBe('apac.amazon.nova-micro-v1:0');
    });
  });

  describe('bedrockRegion', () => {
    it('should default to ap-northeast-1 when no environment variable is set', async () => {
      delete process.env.BEDROCK_REGION;

      const { config } = await import('../../src/config.js');

      expect(config.bedrockRegion).toBe('ap-northeast-1');
    });

    it('should use environment variable when BEDROCK_REGION is set', async () => {
      process.env.BEDROCK_REGION = 'us-east-1';

      const { config } = await import('../../src/config.js');

      expect(config.bedrockRegion).toBe('us-east-1');
    });
  });

  describe('useMockBedrock', () => {
    it('should default to false when no environment variable is set', async () => {
      delete process.env.USE_BEDROCK_MOCK;

      const { config } = await import('../../src/config.js');

      expect(config.useMockBedrock).toBe(false);
    });

    it('should be true when USE_BEDROCK_MOCK is "true"', async () => {
      process.env.USE_BEDROCK_MOCK = 'true';

      const { config } = await import('../../src/config.js');

      expect(config.useMockBedrock).toBe(true);
    });

    it('should be false when USE_BEDROCK_MOCK is any other value', async () => {
      process.env.USE_BEDROCK_MOCK = 'false';

      const { config } = await import('../../src/config.js');

      expect(config.useMockBedrock).toBe(false);
    });
  });

  describe('enableCache', () => {
    it('should default to true when no environment variable is set', async () => {
      delete process.env.ENABLE_BEDROCK_CACHE;

      const { config } = await import('../../src/config.js');

      expect(config.enableCache).toBe(true);
    });

    it('should be false when ENABLE_BEDROCK_CACHE is "false"', async () => {
      process.env.ENABLE_BEDROCK_CACHE = 'false';

      const { config } = await import('../../src/config.js');

      expect(config.enableCache).toBe(false);
    });

    it('should be true when ENABLE_BEDROCK_CACHE is any other value', async () => {
      process.env.ENABLE_BEDROCK_CACHE = 'true';

      const { config } = await import('../../src/config.js');

      expect(config.enableCache).toBe(true);
    });
  });
});
