import { ISmsMessage, ISmsResponse } from "../interfaces/sms-driver.interface";
import { ISmsConfig } from "../interfaces/sms-config.interface";
import { DriverType } from "../types/driver-types";
import { randomUUID } from "crypto";
import { SmsDriverFactory } from "./sms-driver-factory";
import {
  ConfigurationException,
  MessageValidationException,
  SmsException,
} from "../exceptions/sms-exceptions";
import { ISmsProviderAttempt } from "../interfaces/sms-fallback.interface";

/**
 * Main SMS service class - provides a high-level interface for SMS operations
 * This is the primary class that applications should use
 */
export class SmsService {
  private readonly driverFactory: SmsDriverFactory;
  private readonly config: ISmsConfig;

  constructor(config: ISmsConfig, driverFactory?: SmsDriverFactory) {
    this.validateConfig(config);
    this.config = config;
    this.driverFactory = driverFactory || new SmsDriverFactory(config);
  }

  /**
   * Send a template-based SMS message (OTP, verification codes, etc.)
   */
  async verify(message: ISmsMessage): Promise<ISmsResponse> {
    this.validateMessage(message);

    if (!message.template) {
      throw new MessageValidationException(
        "Template is required for verify operation",
      );
    }

    if (!message.tokens) {
      throw new MessageValidationException(
        "Tokens are required for verify operation",
      );
    }

    const requestId = message.requestId || randomUUID();
    const fallbackEnabled =
      message.fallback ?? this.config.fallback?.enabled ?? false;

    if (!fallbackEnabled) {
      const driverType = message.driver || this.config.defaultDriver;
      try {
        const response = await this.driverFactory
          .createDriver(driverType)
          .verify(this.applyProviderOverride(message, driverType, requestId));
        return { ...response, requestId, driver: driverType };
      } catch (error) {
        throw this.handleError(error, "Send verification SMS");
      }
    }

    return this.verifyWithFallback(message, requestId);
  }

  /**
   * Get list of available drivers
   */
  getAvailableDrivers(): DriverType[] {
    return this.driverFactory.getAvailableDrivers();
  }

  /**
   * Check if a specific driver is available
   */
  isDriverAvailable(driverType: DriverType): boolean {
    return this.driverFactory.isDriverAvailable(driverType);
  }

  /**
   * Get the default driver type
   */
  getDefaultDriver(): DriverType {
    return this.config.defaultDriver;
  }

  /**
   * Create a template-based SMS message object
   */
  createVerificationMessage(
    to: string,
    template: string,
    tokens: Record<string, unknown> | unknown[],
    options: {
      driver?: DriverType;
      fallback?: boolean;
      requestId?: string;
    } = {},
  ): ISmsMessage {
    return {
      to,
      template,
      tokens,
      driver: options.driver,
      fallback: options.fallback,
      requestId: options.requestId,
    };
  }

  /**
   * Validate SMS message
   */
  private validateMessage(message: ISmsMessage): void {
    if (!message) {
      throw new MessageValidationException("Message is required");
    }

    if (!message.to) {
      throw new MessageValidationException(
        "Recipient phone number is required",
      );
    }

    if (!message.content && !message.template) {
      throw new MessageValidationException(
        "Either content or template must be provided",
      );
    }

    if (message.template && !message.tokens) {
      throw new MessageValidationException(
        "Tokens are required when using templates",
      );
    }
  }

  /**
   * Validate service configuration
   */
  private validateConfig(config: ISmsConfig): void {
    if (!config) {
      throw new MessageValidationException("SMS configuration is required");
    }

    if (!config.defaultDriver) {
      throw new MessageValidationException("Default driver is required");
    }

    if (!config.drivers || Object.keys(config.drivers).length === 0) {
      throw new MessageValidationException(
        "At least one driver configuration is required",
      );
    }
  }

  private async verifyWithFallback(
    message: ISmsMessage,
    requestId: string,
  ): Promise<ISmsResponse> {
    const attempts: ISmsProviderAttempt[] = [];
    const candidates = await this.resolveCandidates(message, requestId);
    let lastResponse: ISmsResponse | undefined;
    let lastDriver: DriverType | undefined;

    for (const driverType of candidates) {
      lastDriver = driverType;
      if (!this.driverFactory.isDriverAvailable(driverType)) {
        await this.recordAttempt(attempts, {
          requestId,
          driver: driverType,
          outcome: "skipped",
          durationMs: 0,
          attemptedAt: new Date().toISOString(),
          error: `Driver '${driverType}' is not configured or is invalid`,
          errorCode: "DRIVER_UNAVAILABLE",
          failureKind: "configuration",
        });
        continue;
      }

      const startedAt = Date.now();
      const attemptedAt = new Date().toISOString();
      let response: ISmsResponse;
      try {
        response = await this.driverFactory
          .createDriver(driverType)
          .verify(this.applyProviderOverride(message, driverType, requestId));
      } catch (error) {
        response = this.responseFromThrownError(error);
      }

      lastResponse = response;
      const submissionStatus = response.success
        ? "accepted"
        : response.submissionStatus || "unknown";
      await this.recordAttempt(attempts, {
        requestId,
        driver: driverType,
        outcome: submissionStatus,
        durationMs: Date.now() - startedAt,
        attemptedAt,
        messageId: response.messageId,
        error: response.error,
        errorCode: response.errorCode,
        failureKind: response.failureKind,
      });

      if (response.success) {
        return {
          ...response,
          requestId,
          driver: driverType,
          submissionStatus: "accepted",
          attempts,
        };
      }

      // Unknown submission state or an invalid recipient is terminal. Retrying
      // could duplicate a message or cannot succeed for this recipient.
      if (
        submissionStatus === "unknown" ||
        response.failureKind === "recipient"
      ) {
        return {
          ...response,
          requestId,
          driver: driverType,
          errorCode:
            submissionStatus === "unknown"
              ? "SUBMISSION_OUTCOME_UNKNOWN"
              : response.errorCode,
          attempts,
        };
      }
    }

    return {
      success: false,
      requestId,
      driver: lastDriver,
      submissionStatus: "rejected",
      failureKind: lastResponse?.failureKind || "configuration",
      error: "All configured SMS drivers rejected or skipped the submission",
      errorCode: "ALL_DRIVERS_FAILED",
      data: lastResponse?.data,
      attempts,
    };
  }

  private async resolveCandidates(
    message: ISmsMessage,
    requestId: string,
  ): Promise<DriverType[]> {
    const primary = message.driver || this.config.defaultDriver;
    const configuredOrder = this.config.fallback?.order || [];
    let resolvedOrder: readonly DriverType[] = [];

    if (this.config.fallback?.resolver) {
      try {
        resolvedOrder = await this.config.fallback.resolver({
          requestId,
          requestedDriver: message.driver,
          defaultDriver: this.config.defaultDriver,
          availableDrivers: this.driverFactory.getAvailableDrivers(),
          configuredOrder,
        });
      } catch {
        // A policy-store outage must not prevent the static fallback policy.
        resolvedOrder = [];
      }
    }

    const validDrivers = new Set(Object.values(DriverType));
    return Array.from(
      new Set(
        [primary, ...resolvedOrder, ...configuredOrder].filter(
          (driver): driver is DriverType => validDrivers.has(driver),
        ),
      ),
    );
  }

  private applyProviderOverride(
    message: ISmsMessage,
    driver: DriverType,
    requestId: string,
  ): ISmsMessage {
    const override = message.providerOverrides?.[driver];
    return {
      ...message,
      ...override,
      driver,
      requestId,
    };
  }

  private async recordAttempt(
    attempts: ISmsProviderAttempt[],
    attempt: ISmsProviderAttempt,
  ): Promise<void> {
    attempts.push(attempt);
    try {
      await this.config.fallback?.observer?.({ ...attempt });
    } catch {
      // Observability is best-effort and must not alter delivery behavior.
    }
  }

  private responseFromThrownError(error: unknown): ISmsResponse {
    if (error instanceof MessageValidationException) {
      return {
        success: false,
        submissionStatus: "rejected",
        failureKind: "validation",
        error: error.message,
        errorCode: error._code || "MESSAGE_VALIDATION_FAILED",
      };
    }

    if (error instanceof ConfigurationException) {
      return {
        success: false,
        submissionStatus: "rejected",
        failureKind: "configuration",
        error: error.message,
        errorCode: error._code || "CONFIGURATION_ERROR",
      };
    }

    return {
      success: false,
      submissionStatus: "unknown",
      failureKind: "unexpected",
      error: "Unexpected driver failure",
      errorCode: "DRIVER_ERROR",
    };
  }

  /**
   * Handle and standardize errors
   */
  private handleError(error: unknown, context: string): SmsException {
    if (error instanceof SmsException) {
      return error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return new SmsException(
      `${context} failed: ${errorMessage}`,
      error,
      "SERVICE_ERROR",
    );
  }
}
