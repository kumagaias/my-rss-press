/**
 * Unit tests for structured logger utility
 * 
 * Tests error logging format, CloudWatch integration, and metrics logging
 * 
 * Requirements tested:
 * - 8.6: Error logging to CloudWatch
 * - 11.5: Logging format consistency
 * - 12.1: API call count logging
 * - 12.2: Response time logging
 * - 12.3: Token usage logging
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logStructuredError,
  logStructuredWarning,
  logStructuredInfo,
  logMonitoringMetrics,
  extractTokenUsage,
  type ErrorType,
  type StructuredLogContext,
  type MonitoringMetrics,
} from '../../../src/utils/structuredLogger.js';

describe('structuredLogger', () => {
  // Mock console methods
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('logStructuredError', () => {
    it('should log error with correct JSON format', () => {
      // Arrange
      const service = 'feedSuggestionService';
      const errorType: ErrorType = 'API_ERROR';
      const errorMessage = 'Bedrock API failed';
      const context: StructuredLogContext = {
        theme: 'technology',
        locale: 'en',
      };
      const modelId = 'amazon.nova-micro-v1:0';

      // Act
      logStructuredError(service, errorType, errorMessage, context, undefined, modelId);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        level: 'ERROR',
        service,
        modelId,
        errorType,
        errorMessage,
        context,
      });
      expect(loggedData.timestamp).toBeDefined();
      expect(typeof loggedData.timestamp).toBe('string');
    });

    it('should include stack trace when error object is provided', () => {
      // Arrange
      const service = 'summaryGenerationService';
      const errorType: ErrorType = 'PARSE_ERROR';
      const errorMessage = 'Failed to parse response';
      const error = new Error('JSON parse error');

      // Act
      logStructuredError(service, errorType, errorMessage, {}, error);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(loggedData.stack).toBeDefined();
      expect(loggedData.stack).toContain('Error: JSON parse error');
    });

    it('should handle error without stack trace', () => {
      // Arrange
      const service = 'importanceCalculator';
      const errorType: ErrorType = 'VALIDATION_ERROR';
      const errorMessage = 'Invalid score range';

      // Act
      logStructuredError(service, errorType, errorMessage);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(loggedData.stack).toBeUndefined();
    });

    it('should handle non-Error objects gracefully', () => {
      // Arrange
      const service = 'articleFilterService';
      const errorType: ErrorType = 'API_ERROR';
      const errorMessage = 'Unknown error';
      const nonErrorObject = { message: 'Something went wrong' };

      // Act
      logStructuredError(service, errorType, errorMessage, {}, nonErrorObject);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      expect(loggedData.stack).toBeUndefined();
    });

    it('should log all error types correctly', () => {
      // Arrange
      const errorTypes: ErrorType[] = ['API_ERROR', 'PARSE_ERROR', 'VALIDATION_ERROR', 'CONFIGURATION_ERROR'];

      // Act & Assert
      errorTypes.forEach((errorType) => {
        consoleErrorSpy.mockClear();
        logStructuredError('testService', errorType, 'Test error', {});

        expect(consoleErrorSpy).toHaveBeenCalledOnce();
        const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
        expect(loggedData.errorType).toBe(errorType);
      });
    });

    it('should include custom context fields', () => {
      // Arrange
      const context: StructuredLogContext = {
        theme: 'sports',
        articleCount: 15,
        locale: 'ja',
        customField: 'custom value',
      };

      // Act
      logStructuredError('bedrockService', 'API_ERROR', 'Test', context);

      // Assert
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(loggedData.context).toEqual(context);
    });
  });

  describe('logStructuredWarning', () => {
    it('should log warning with correct JSON format', () => {
      // Arrange
      const service = 'summaryGenerationService';
      const message = 'Empty summary from Bedrock';
      const context: StructuredLogContext = {
        theme: 'technology',
        articleCount: 10,
      };
      const modelId = 'amazon.nova-micro-v1:0';

      // Act
      logStructuredWarning(service, message, context, modelId);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        level: 'WARN',
        service,
        modelId,
        errorMessage: message,
        context,
      });
      expect(loggedData.timestamp).toBeDefined();
    });

    it('should work without context and modelId', () => {
      // Arrange
      const service = 'testService';
      const message = 'Warning message';

      // Act
      logStructuredWarning(service, message);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0]);

      expect(loggedData.level).toBe('WARN');
      expect(loggedData.service).toBe(service);
      expect(loggedData.errorMessage).toBe(message);
    });
  });

  describe('logStructuredInfo', () => {
    it('should log info with correct JSON format', () => {
      // Arrange
      const service = 'bedrockService';
      const message = 'Feed suggestions completed';
      const context: StructuredLogContext = {
        theme: 'technology',
        feedCount: 15,
      };
      const modelId = 'amazon.nova-micro-v1:0';

      // Act
      logStructuredInfo(service, message, context, modelId);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        level: 'INFO',
        service,
        modelId,
        errorMessage: message,
        context,
      });
      expect(loggedData.timestamp).toBeDefined();
    });
  });

  describe('logMonitoringMetrics', () => {
    it('should log metrics with correct format for successful API call', () => {
      // Arrange
      const metrics: MonitoringMetrics = {
        apiCallCount: 1,
        responseTimeMs: 1234,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        modelId: 'amazon.nova-micro-v1:0',
        service: 'bedrockService',
        operation: 'suggestFeeds',
        success: true,
      };

      // Act
      logMonitoringMetrics(metrics);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData).toMatchObject({
        level: 'METRIC',
        metricType: 'BEDROCK_API_CALL',
        ...metrics,
      });
      expect(loggedData.timestamp).toBeDefined();
    });

    it('should log metrics for failed API call', () => {
      // Arrange
      const metrics: MonitoringMetrics = {
        apiCallCount: 1,
        responseTimeMs: 0,
        modelId: 'amazon.nova-micro-v1:0',
        service: 'summaryGenerationService',
        operation: 'generateSummary',
        success: false,
        errorType: 'TimeoutError',
      };

      // Act
      logMonitoringMetrics(metrics);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData.success).toBe(false);
      expect(loggedData.errorType).toBe('TimeoutError');
      expect(loggedData.responseTimeMs).toBe(0);
    });

    it('should log metrics without token usage', () => {
      // Arrange
      const metrics: MonitoringMetrics = {
        apiCallCount: 1,
        responseTimeMs: 500,
        modelId: 'amazon.nova-micro-v1:0',
        service: 'importanceCalculator',
        operation: 'calculateImportance',
        success: true,
      };

      // Act
      logMonitoringMetrics(metrics);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      expect(loggedData.inputTokens).toBeUndefined();
      expect(loggedData.outputTokens).toBeUndefined();
      expect(loggedData.totalTokens).toBeUndefined();
    });

    it('should log metrics for all services', () => {
      // Arrange
      const services = [
        'bedrockService',
        'summaryGenerationService',
        'importanceCalculator',
        'articleFilterService',
        'editorialColumnService',
      ];

      // Act & Assert
      services.forEach((service) => {
        consoleLogSpy.mockClear();
        const metrics: MonitoringMetrics = {
          apiCallCount: 1,
          responseTimeMs: 1000,
          modelId: 'amazon.nova-micro-v1:0',
          service,
          operation: 'testOperation',
          success: true,
        };

        logMonitoringMetrics(metrics);

        expect(consoleLogSpy).toHaveBeenCalledOnce();
        const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
        expect(loggedData.service).toBe(service);
      });
    });

    it('should log metrics with both model IDs', () => {
      // Arrange
      const modelIds = ['amazon.nova-micro-v1:0', 'anthropic.claude-3-haiku-20240307-v1:0'];

      // Act & Assert
      modelIds.forEach((modelId) => {
        consoleLogSpy.mockClear();
        const metrics: MonitoringMetrics = {
          apiCallCount: 1,
          responseTimeMs: 1000,
          modelId,
          service: 'bedrockService',
          operation: 'suggestFeeds',
          success: true,
        };

        logMonitoringMetrics(metrics);

        expect(consoleLogSpy).toHaveBeenCalledOnce();
        const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
        expect(loggedData.modelId).toBe(modelId);
      });
    });
  });

  describe('extractTokenUsage', () => {
    it('should extract token usage from Nova Micro response format', () => {
      // Arrange
      const response = {
        usage: {
          inputTokens: 100,
          outputTokens: 50,
        },
      };

      // Act
      const result = extractTokenUsage(response);

      // Assert
      expect(result).toEqual({
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
      });
    });

    it('should extract token usage from Claude 3 Haiku response format', () => {
      // Arrange
      const response = {
        usage: {
          input_tokens: 200,
          output_tokens: 100,
        },
      };

      // Act
      const result = extractTokenUsage(response);

      // Assert
      expect(result).toEqual({
        inputTokens: 200,
        outputTokens: 100,
        totalTokens: 300,
      });
    });

    it('should handle response with only input tokens', () => {
      // Arrange
      const response = {
        usage: {
          inputTokens: 150,
        },
      };

      // Act
      const result = extractTokenUsage(response);

      // Assert
      expect(result).toEqual({
        inputTokens: 150,
        outputTokens: 0,
        totalTokens: 150,
      });
    });

    it('should handle response with only output tokens', () => {
      // Arrange
      const response = {
        usage: {
          outputTokens: 75,
        },
      };

      // Act
      const result = extractTokenUsage(response);

      // Assert
      expect(result).toEqual({
        inputTokens: 0,
        outputTokens: 75,
        totalTokens: 75,
      });
    });

    it('should return undefined when usage is not available', () => {
      // Arrange
      const response = {
        output: {
          message: {
            content: [{ text: 'response' }],
          },
        },
      };

      // Act
      const result = extractTokenUsage(response);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty response', () => {
      // Arrange
      const response = {};

      // Act
      const result = extractTokenUsage(response);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle malformed response gracefully', () => {
      // Arrange
      const response = {
        usage: 'invalid',
      };

      // Act
      const result = extractTokenUsage(response);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle null response gracefully', () => {
      // Arrange
      const response = null;

      // Act
      const result = extractTokenUsage(response);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('Logging format consistency (Requirement 11.5)', () => {
    it('should maintain consistent timestamp format across all log types', () => {
      // Act
      logStructuredError('service1', 'API_ERROR', 'error');
      logStructuredWarning('service2', 'warning');
      logStructuredInfo('service3', 'info');
      logMonitoringMetrics({
        apiCallCount: 1,
        responseTimeMs: 100,
        modelId: 'test-model',
        service: 'service4',
        operation: 'test',
        success: true,
      });

      // Assert
      const errorLog = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      const warnLog = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      const infoLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const metricLog = JSON.parse(consoleLogSpy.mock.calls[1][0]);

      // All timestamps should be valid ISO 8601 format
      expect(errorLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(warnLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(infoLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(metricLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should maintain consistent field names across all log types', () => {
      // Act
      logStructuredError('service1', 'API_ERROR', 'error', { theme: 'test' }, undefined, 'model1');
      logStructuredWarning('service2', 'warning', { theme: 'test' }, 'model2');
      logStructuredInfo('service3', 'info', { theme: 'test' }, 'model3');

      // Assert
      const errorLog = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      const warnLog = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      const infoLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);

      // All should have consistent field names
      expect(errorLog).toHaveProperty('timestamp');
      expect(errorLog).toHaveProperty('level');
      expect(errorLog).toHaveProperty('service');
      expect(errorLog).toHaveProperty('modelId');

      expect(warnLog).toHaveProperty('timestamp');
      expect(warnLog).toHaveProperty('level');
      expect(warnLog).toHaveProperty('service');
      expect(warnLog).toHaveProperty('modelId');

      expect(infoLog).toHaveProperty('timestamp');
      expect(infoLog).toHaveProperty('level');
      expect(infoLog).toHaveProperty('service');
      expect(infoLog).toHaveProperty('modelId');
    });

    it('should produce valid JSON for all log entries', () => {
      // Act
      logStructuredError('service1', 'API_ERROR', 'error', { theme: 'test' });
      logStructuredWarning('service2', 'warning', { theme: 'test' });
      logStructuredInfo('service3', 'info', { theme: 'test' });
      logMonitoringMetrics({
        apiCallCount: 1,
        responseTimeMs: 100,
        modelId: 'test-model',
        service: 'service4',
        operation: 'test',
        success: true,
      });

      // Assert - all should parse without errors
      expect(() => JSON.parse(consoleErrorSpy.mock.calls[0][0])).not.toThrow();
      expect(() => JSON.parse(consoleWarnSpy.mock.calls[0][0])).not.toThrow();
      expect(() => JSON.parse(consoleLogSpy.mock.calls[0][0])).not.toThrow();
      expect(() => JSON.parse(consoleLogSpy.mock.calls[1][0])).not.toThrow();
    });
  });

  describe('CloudWatch integration (Requirements 8.6, 12.1, 12.2, 12.3)', () => {
    it('should log API errors to CloudWatch with required fields', () => {
      // Arrange
      const service = 'bedrockService';
      const errorType: ErrorType = 'API_ERROR';
      const errorMessage = 'Bedrock API timeout';
      const context = { theme: 'technology', locale: 'en' };
      const modelId = 'amazon.nova-micro-v1:0';

      // Act
      logStructuredError(service, errorType, errorMessage, context, undefined, modelId);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0]);

      // Verify CloudWatch-required fields
      expect(loggedData.timestamp).toBeDefined();
      expect(loggedData.service).toBe(service);
      expect(loggedData.modelId).toBe(modelId);
      expect(loggedData.errorType).toBe(errorType);
      expect(loggedData.errorMessage).toBe(errorMessage);
      expect(loggedData.context).toEqual(context);
    });

    it('should log API call counts (Requirement 12.1)', () => {
      // Arrange
      const metrics: MonitoringMetrics = {
        apiCallCount: 1,
        responseTimeMs: 1000,
        modelId: 'amazon.nova-micro-v1:0',
        service: 'bedrockService',
        operation: 'suggestFeeds',
        success: true,
      };

      // Act
      logMonitoringMetrics(metrics);

      // Assert
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.apiCallCount).toBe(1);
      expect(loggedData.metricType).toBe('BEDROCK_API_CALL');
    });

    it('should log response times (Requirement 12.2)', () => {
      // Arrange
      const metrics: MonitoringMetrics = {
        apiCallCount: 1,
        responseTimeMs: 2345,
        modelId: 'amazon.nova-micro-v1:0',
        service: 'summaryGenerationService',
        operation: 'generateSummary',
        success: true,
      };

      // Act
      logMonitoringMetrics(metrics);

      // Assert
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.responseTimeMs).toBe(2345);
    });

    it('should log token usage (Requirement 12.3)', () => {
      // Arrange
      const metrics: MonitoringMetrics = {
        apiCallCount: 1,
        responseTimeMs: 1500,
        inputTokens: 250,
        outputTokens: 125,
        totalTokens: 375,
        modelId: 'amazon.nova-micro-v1:0',
        service: 'importanceCalculator',
        operation: 'calculateImportance',
        success: true,
      };

      // Act
      logMonitoringMetrics(metrics);

      // Assert
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.inputTokens).toBe(250);
      expect(loggedData.outputTokens).toBe(125);
      expect(loggedData.totalTokens).toBe(375);
    });

    it('should enable cost comparison between models', () => {
      // Arrange
      const novaMicroMetrics: MonitoringMetrics = {
        apiCallCount: 1,
        responseTimeMs: 1000,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        modelId: 'amazon.nova-micro-v1:0',
        service: 'bedrockService',
        operation: 'suggestFeeds',
        success: true,
      };

      const claudeMetrics: MonitoringMetrics = {
        apiCallCount: 1,
        responseTimeMs: 1200,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        service: 'bedrockService',
        operation: 'suggestFeeds',
        success: true,
      };

      // Act
      logMonitoringMetrics(novaMicroMetrics);
      logMonitoringMetrics(claudeMetrics);

      // Assert
      const novaLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const claudeLog = JSON.parse(consoleLogSpy.mock.calls[1][0]);

      // Both logs should have the same structure for comparison
      expect(novaLog.modelId).toBe('amazon.nova-micro-v1:0');
      expect(claudeLog.modelId).toBe('anthropic.claude-3-haiku-20240307-v1:0');
      expect(novaLog.inputTokens).toBe(claudeLog.inputTokens);
      expect(novaLog.outputTokens).toBe(claudeLog.outputTokens);
    });
  });
});
