import { DriverType } from "../types/driver-types";
import {
  ISmsProviderAttempt,
  ISmsProviderMessageOverride,
  SmsFailureKind,
  SmsSubmissionStatus,
} from "./sms-fallback.interface";

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
  /** Correlation ID. A UUID is generated when omitted. */
  requestId?: string;
  /** Override the service-level fallback switch for this message. */
  fallback?: boolean;
  /** Provider-specific template, token, or sender mappings. */
  providerOverrides?: Partial<Record<DriverType, ISmsProviderMessageOverride>>;
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
  /** Correlation ID shared by every attempt. */
  requestId?: string;
  /** Driver that produced the final result. */
  driver?: DriverType;
  /** Submission certainty; accepted does not mean delivered. */
  submissionStatus?: SmsSubmissionStatus;
  /** Normalized failure category used by the fallback safety policy. */
  failureKind?: SmsFailureKind;
  /** Sanitized attempt history, populated when fallback is enabled. */
  attempts?: ISmsProviderAttempt[];
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
