/**
 * URL utility functions for the SMS service
 * Provides common URL manipulation functionality used across drivers
 */

/**
 * Build URL with query parameters
 * Converts a parameters object into URL query string
 *
 * @param baseUrl - The base URL to append parameters to
 * @param params - Object containing key-value pairs for query parameters
 * @returns Complete URL with query parameters
 *
 * @example
 * ```typescript
 * const url = buildUrlWithParams(
 *   'https://api.example.com/send',
 *   { receptor: '1234567890', message: 'Hello' }
 * );
 * // Returns: 'https://api.example.com/send?receptor=1234567890&message=Hello'
 * ```
 */
export function buildUrlWithParams(
  baseUrl: string,
  params: Record<string, unknown>,
): string {
  if (!baseUrl) {
    throw new Error("Base URL is required");
  }

  try {
    const url = new URL(baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  } catch {
    throw new Error(`Invalid URL format: ${baseUrl}`);
  }
}

/**
 * Validate if a string is a valid URL
 *
 * @param url - The URL string to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely encode a value for use in URL parameters
 *
 * @param value - The value to encode
 * @returns Encoded string value
 */
export function encodeUrlParameter(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return encodeURIComponent(String(value));
}
