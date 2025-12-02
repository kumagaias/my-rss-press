/**
 * Utility functions for common operations
 */

/**
 * Extract error message from unknown error type
 * Provides consistent error handling across the application
 * 
 * @param error - The error object (can be Error, string, or unknown)
 * @param fallbackMessage - Default message if error cannot be extracted
 * @returns Error message string
 */
export function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallbackMessage;
}

/**
 * Safely parse URL and extract hostname
 * Handles malformed URLs gracefully
 * 
 * @param url - URL string to parse
 * @returns Hostname without 'www.' prefix, or the original URL if parsing fails
 */
export function getHostnameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, return the original URL
    return url;
  }
}
