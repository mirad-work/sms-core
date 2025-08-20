import { DriverType } from "../types/driver-types";

/**
 * SMS message structure
 */
export interface ISmsMessage {
  /** Recipient phone number */
  to: string;
  /** Sender number or identifier (optional, will use default from config) */
  from?: string;
  /** Message content for simple messages */
  content?: string;
  /** Template identifier for template-based messages */
  template?: string;
  /** Variables/tokens for template substitution */
  tokens?: Record<string, unknown> | unknown[];
  /** Specific driver to use (optional, will use default from config) */
  driver?: DriverType;
}

/**
 * SMS operation response
 */
export interface ISmsResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** Message ID from the provider (if available) */
  messageId?: string;
  /** Raw response data from the provider */
  data?: unknown;
  /** Error message if the operation failed */
  error?: string;
  /** Error code if the operation failed */
  errorCode?: string;
}

/**
 * Core SMS driver interface that all providers must implement
 */
export interface ISmsDriver {
  /**
   * Send a template-based SMS message (OTP, verification codes, etc.)
   */
  verify(message: ISmsMessage): Promise<ISmsResponse>;
}
