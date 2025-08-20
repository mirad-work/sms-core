import { ISmsMessage, ISmsResponse } from "../interfaces/sms-driver.interface";
import { ISmsConfig } from "../interfaces/sms-config.interface";
import { DriverType } from "../types/driver-types";
import { SmsDriverFactory } from "./sms-driver-factory";
import {
  MessageValidationException,
  SmsException,
} from "../exceptions/sms-exceptions";

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

    try {
      const driver = this.driverFactory.createDriver(message.driver);
      return await driver.verify(message);
    } catch (error) {
      throw this.handleError(error, "Send verification SMS");
    }
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
    } = {},
  ): ISmsMessage {
    return {
      to,
      template,
      tokens,
      driver: options.driver,
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
