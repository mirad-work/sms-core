import { DriverType } from "../types/driver-types";

export type SmsSubmissionStatus = "accepted" | "rejected" | "unknown";

export type SmsFailureKind =
  | "provider_rejection"
  | "http"
  | "timeout"
  | "network"
  | "configuration"
  | "validation"
  | "recipient"
  | "unexpected";

export type SmsAttemptOutcome = SmsSubmissionStatus | "skipped";

/** Safe, provider-neutral audit data. It deliberately excludes message content and credentials. */
export interface ISmsProviderAttempt {
  requestId: string;
  driver: DriverType;
  outcome: SmsAttemptOutcome;
  durationMs: number;
  attemptedAt: string;
  messageId?: string;
  error?: string;
  errorCode?: string;
  failureKind?: SmsFailureKind;
}

export interface ISmsFallbackResolverContext {
  requestId: string;
  requestedDriver?: DriverType;
  defaultDriver: DriverType;
  availableDrivers: readonly DriverType[];
  configuredOrder: readonly DriverType[];
}

export type ISmsFallbackResolver = (
  context: ISmsFallbackResolverContext,
) => readonly DriverType[] | Promise<readonly DriverType[]>;

export type ISmsFallbackObserver = (
  attempt: Readonly<ISmsProviderAttempt>,
) => void | Promise<void>;

export interface ISmsFallbackConfig {
  /** Fallback is opt-in and disabled unless this is explicitly true. */
  enabled?: boolean;
  /** Drivers tried after the requested/default driver, in priority order. */
  order?: DriverType[];
  /** Optional external policy hook, suitable for database-driven ordering. */
  resolver?: ISmsFallbackResolver;
  /** Best-effort hook for persisting metrics or attempt history. */
  observer?: ISmsFallbackObserver;
}

export interface ISmsProviderMessageOverride {
  template?: string;
  tokens?: Record<string, unknown> | unknown[];
  from?: string;
}
