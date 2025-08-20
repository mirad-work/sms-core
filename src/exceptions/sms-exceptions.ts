/**
 * Base SMS exception class
 */
export class SmsException extends Error {
  constructor(
    message: string,
    public readonly _originalError?: unknown,
    public readonly _code?: string,
  ) {
    super(message);
    this.name = "SmsException";

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SmsException);
    }
  }
}

/**
 * Exception thrown when an unsupported driver is requested
 */
export class UnsupportedDriverException extends SmsException {
  constructor(driver: string) {
    super(`Unsupported SMS driver: ${driver}`, undefined, "UNSUPPORTED_DRIVER");
    this.name = "UnsupportedDriverException";
  }
}

/**
 * Exception thrown when a driver encounters an error
 */
export class SmsDriverException extends SmsException {
  constructor(message: string, originalError?: unknown, code?: string) {
    super(message, originalError, code);
    this.name = "SmsDriverException";
  }
}

/**
 * Exception thrown when configuration is invalid
 */
export class ConfigurationException extends SmsException {
  constructor(message: string, code?: string) {
    super(message, undefined, code);
    this.name = "ConfigurationException";
  }
}

/**
 * Exception thrown when required configuration is missing
 */
export class MissingConfigException extends ConfigurationException {
  constructor(missingKey: string) {
    super(`Missing required configuration: ${missingKey}`, "MISSING_CONFIG");
    this.name = "MissingConfigException";
  }
}

/**
 * Exception thrown when message validation fails
 */
export class MessageValidationException extends SmsException {
  constructor(message: string, code?: string) {
    super(message, undefined, code);
    this.name = "MessageValidationException";
  }
}

/**
 * Exception thrown when rate limit is exceeded
 */
export class RateLimitException extends SmsException {
  constructor(message = "Rate limit exceeded") {
    super(message, undefined, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitException";
  }
}

/**
 * Exception thrown when HTTP request fails
 */
export class HttpException extends SmsException {
  constructor(
    message: string,
    public readonly _status?: number,
    _originalError?: unknown,
  ) {
    super(message, _originalError, "HTTP_ERROR");
    this.name = "HttpException";
  }
}
