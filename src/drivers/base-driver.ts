import {
  ISmsDriver,
  ISmsMessage,
  ISmsResponse,
} from "../interfaces/sms-driver.interface";
import { IHttpClient } from "../interfaces/http-client.interface";
import {
  SmsDriverException,
  MessageValidationException,
  HttpException,
} from "../exceptions/sms-exceptions";
import { HttpResponse } from "../types/driver-types";

/**
 * Base configuration interface for all drivers
 */
export interface IBaseDriverConfig {
  url: string;
  timeout?: number;
}

/**
 * Abstract base class for all SMS drivers
 * Provides common functionality and enforces interface implementation
 */
export abstract class BaseSmsDriver implements ISmsDriver {
  protected readonly httpClient: IHttpClient;
  protected readonly config: IBaseDriverConfig;

  constructor(config: IBaseDriverConfig, httpClient: IHttpClient) {
    this.validateConfig(config);
    this.config = config;
    this.httpClient = httpClient;
  }

  // Abstract methods that must be implemented by concrete drivers
  abstract verify(_message: ISmsMessage): Promise<ISmsResponse>;

  /**
   * Build default headers for HTTP requests
   */
  protected buildHeaders(
    additionalHeaders: Record<string, string> = {},
  ): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "@mirad/sms-core",
      ...additionalHeaders,
    };
  }

  /**
   * Build URL by combining base URL with endpoint
   */
  protected buildUrl(endpoint: string): string {
    if (!this.config.url) {
      throw new SmsDriverException("Driver URL is not configured");
    }

    const baseUrl = this.config.url.replace(/\/$/, "");
    const cleanEndpoint = endpoint.replace(/^\//, "");
    return `${baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Validate SMS message before sending
   */
  protected validateMessage(message: ISmsMessage): void {
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

    // Basic phone number validation (should start with + or digits)
    if (!/^[+\d][\d\s-()]*$/.test(message.to)) {
      throw new MessageValidationException("Invalid phone number format");
    }
  }

  /**
   * Validate driver configuration
   */
  private validateConfig(config: IBaseDriverConfig): void {
    if (!config) {
      throw new SmsDriverException("Driver configuration is required");
    }

    if (!config.url) {
      throw new SmsDriverException("Driver URL is required");
    }

    try {
      new URL(config.url);
    } catch {
      throw new SmsDriverException("Invalid driver URL format");
    }
  }

  /**
   * Handle HTTP errors and convert to appropriate exceptions
   */
  protected async handleHttpRequest<T>(
    requestFn: () => Promise<HttpResponse<T>>,
  ): Promise<HttpResponse<T>> {
    try {
      const response = await requestFn();

      // Check for HTTP error status codes
      if (response.status >= 400) {
        throw new HttpException(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.data,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new SmsDriverException(
        `HTTP request failed: ${(error as Error).message}`,
        error,
        "HTTP_REQUEST_FAILED",
      );
    }
  }

  /**
   * Handle and standardize driver errors
   */
  protected handleError(error: unknown, context = "Driver operation"): never {
    if (
      error instanceof SmsDriverException ||
      error instanceof MessageValidationException
    ) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new SmsDriverException(
      `${context} failed: ${errorMessage}`,
      error,
      "DRIVER_ERROR",
    );
  }

  /**
   * Create a standardized success response
   */
  protected createSuccessResponse(
    data: unknown,
    messageId?: string,
  ): ISmsResponse {
    return {
      success: true,
      messageId,
      data,
    };
  }

  /**
   * Create a standardized error response
   */
  protected createErrorResponse(
    error: string,
    errorCode?: string,
    data?: unknown,
  ): ISmsResponse {
    return {
      success: false,
      error,
      errorCode,
      data,
    };
  }

  /**
   * Extract message ID from provider response
   * This method can be overridden by concrete drivers if needed
   */
  protected extractMessageId(response: unknown): string | undefined {
    if (!response || typeof response !== "object") {
      return undefined;
    }

    const responseObj = response as Record<string, unknown>;

    // Common patterns for message ID extraction
    const messageId =
      responseObj.messageId ||
      responseObj.id ||
      responseObj.message_id ||
      (responseObj.data &&
        typeof responseObj.data === "object" &&
        (responseObj.data as Record<string, unknown>).messageId) ||
      (responseObj.data &&
        typeof responseObj.data === "object" &&
        (responseObj.data as Record<string, unknown>).id);

    return typeof messageId === "string" ? messageId : undefined;
  }

  /**
   * Log request/response for debugging (can be overridden)
   */
  protected log(
    level: "info" | "error" | "warn" | "debug",
    message: string,
    data?: unknown,
  ): void {
    // Simple console logging - can be replaced with proper logging library
    const timestamp = new Date().toISOString();
    const logData = data ? JSON.stringify(data, null, 2) : "";

    // eslint-disable-next-line no-console
    console[level](`[${timestamp}] [SMS-Driver] ${message}`, logData);
  }
}
