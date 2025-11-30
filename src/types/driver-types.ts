/**
 * Supported SMS driver types
 */
export enum DriverType {
  KAVENEGAR = "kavenegar",
  SMSIR = "smsir",
  MELIPAYAMAK = "melipayamak",
  IPPANEL = "ippanel",
  MOCK = "mock", // For testing purposes
}

/**
 * SMS delivery status types
 */
export type SmsStatus = "pending" | "sent" | "delivered" | "failed";

/**
 * HTTP methods supported by drivers
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  data?: unknown;
  timeout?: number;
}

/**
 * HTTP response structure
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}
