/**
 * Application Constants
 * 
 * Centralized configuration for default values and constants
 */

/**
 * Default language settings
 */
export const DEFAULT_LANGUAGE = {
  /** Default language code for language detection (JP or EN) */
  DETECTION: 'EN' as const,
  
  /** Default locale for UI and content (en or ja) */
  LOCALE: 'en' as const,
} as const;

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = {
  /** Language codes for detection */
  DETECTION: ['JP', 'EN'] as const,
  
  /** Locale codes for UI */
  LOCALE: ['en', 'ja'] as const,
} as const;
