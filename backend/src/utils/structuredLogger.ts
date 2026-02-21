/**
 * Structured Logger Utility
 * 
 * Provides structured JSON logging for CloudWatch with appropriate severity levels
 */

export type ErrorType = 'API_ERROR' | 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'CONFIGURATION_ERROR';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'METRIC';

export interface StructuredLogContext {
  theme?: string;
  articleCount?: number;
  locale?: string;
  feedCount?: number;
  attempt?: number;
  maxRetries?: number;
  [key: string]: any; // Allow additional service-specific context
}

/**
 * Monitoring metrics for cost tracking and performance analysis
 */
export interface MonitoringMetrics {
  apiCallCount: number;
  responseTimeMs: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  modelId: string;
  service: string;
  operation: string;
  success: boolean;
  errorType?: string;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  modelId?: string;
  errorType?: ErrorType;
  errorMessage: string;
  context?: StructuredLogContext;
  stack?: string;
}

/**
 * Log structured error to CloudWatch
 * 
 * @param service - Service name (e.g., 'feedSuggestionService', 'summaryGenerationService')
 * @param errorType - Type of error
 * @param errorMessage - Error message
 * @param context - Service-specific context
 * @param error - Original error object (optional, for stack trace)
 * @param modelId - Bedrock model ID (optional)
 */
export function logStructuredError(
  service: string,
  errorType: ErrorType,
  errorMessage: string,
  context?: StructuredLogContext,
  error?: Error | unknown,
  modelId?: string
): void {
  const logEntry: StructuredLogEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    service,
    modelId,
    errorType,
    errorMessage,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  };

  // Log as JSON for CloudWatch structured logging
  console.error(JSON.stringify(logEntry));
}

/**
 * Log structured warning to CloudWatch
 * 
 * @param service - Service name
 * @param message - Warning message
 * @param context - Service-specific context
 * @param modelId - Bedrock model ID (optional)
 */
export function logStructuredWarning(
  service: string,
  message: string,
  context?: StructuredLogContext,
  modelId?: string
): void {
  const logEntry: StructuredLogEntry = {
    timestamp: new Date().toISOString(),
    level: 'WARN',
    service,
    modelId,
    errorMessage: message,
    context,
  };

  console.warn(JSON.stringify(logEntry));
}

/**
 * Log structured info to CloudWatch
 * 
 * @param service - Service name
 * @param message - Info message
 * @param context - Service-specific context
 * @param modelId - Bedrock model ID (optional)
 */
export function logStructuredInfo(
  service: string,
  message: string,
  context?: StructuredLogContext,
  modelId?: string
): void {
  const logEntry: StructuredLogEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    service,
    modelId,
    errorMessage: message,
    context,
  };

  console.log(JSON.stringify(logEntry));
}

/**
 * Log monitoring metrics to CloudWatch for cost tracking and performance analysis
 * 
 * This function logs API call counts, response times, and token usage to CloudWatch.
 * These metrics enable:
 * - Cost analysis and comparison between models (Claude 3 Haiku vs Nova Micro)
 * - Performance monitoring and optimization
 * - Usage tracking and capacity planning
 * 
 * @param metrics - Monitoring metrics to log
 * 
 * @example
 * ```typescript
 * logMonitoringMetrics({
 *   apiCallCount: 1,
 *   responseTimeMs: 1234,
 *   inputTokens: 100,
 *   outputTokens: 50,
 *   totalTokens: 150,
 *   modelId: 'amazon.nova-micro-v1:0',
 *   service: 'feedSuggestionService',
 *   operation: 'suggestFeeds',
 *   success: true,
 * });
 * ```
 */
export function logMonitoringMetrics(metrics: MonitoringMetrics): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'METRIC' as LogLevel,
    metricType: 'BEDROCK_API_CALL',
    ...metrics,
  };

  // Log as JSON for CloudWatch structured logging
  // CloudWatch Insights can query these metrics for cost analysis
  console.log(JSON.stringify(logEntry));
}

/**
 * Extract token usage from Bedrock response
 * 
 * Supports both Claude 3 Haiku and Nova Micro response formats:
 * - Claude 3 Haiku: { usage: { input_tokens, output_tokens } }
 * - Nova Micro: { usage: { inputTokens, outputTokens } }
 * 
 * @param response - Bedrock API response
 * @returns Token usage object or undefined if not available
 */
export function extractTokenUsage(response: any): { inputTokens?: number; outputTokens?: number; totalTokens?: number } | undefined {
  try {
    // Try Nova Micro format first (camelCase)
    if (response.usage?.inputTokens !== undefined || response.usage?.outputTokens !== undefined) {
      const inputTokens = response.usage.inputTokens || 0;
      const outputTokens = response.usage.outputTokens || 0;
      return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      };
    }
    
    // Try Claude 3 Haiku format (snake_case)
    if (response.usage?.input_tokens !== undefined || response.usage?.output_tokens !== undefined) {
      const inputTokens = response.usage.input_tokens || 0;
      const outputTokens = response.usage.output_tokens || 0;
      return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      };
    }
    
    return undefined;
  } catch (error) {
    // If extraction fails, return undefined (token usage is optional)
    return undefined;
  }
}
