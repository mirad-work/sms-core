/**
 * Mirad SMS Core - Framework-agnostic TypeScript SMS service
 *
 * A flexible, provider-agnostic SMS service with support for multiple Iranian providers.
 */

// Main service class
export { SmsService } from "./services/sms-service";

// Driver factory
export { SmsDriverFactory } from "./services/sms-driver-factory";

// Configuration
export { SmsConfigManager } from "./config/sms-config";

// Core interfaces
export {
  ISmsDriver,
  ISmsMessage,
  ISmsResponse,
} from "./interfaces/sms-driver.interface";

export {
  ISmsConfig,
  IKavenegarConfig,
  ISmsIrConfig,
  IMelipayamakConfig,
  IIppanelConfig,
  IMockConfig,
} from "./interfaces/sms-config.interface";

export { IHttpClient } from "./interfaces/http-client.interface";

// Types and enums
export {
  DriverType,
  SmsStatus,
  HttpMethod,
  HttpRequestConfig,
  HttpResponse,
} from "./types/driver-types";

// HTTP client
export { HttpClient } from "./utils/http-client";

// Exceptions
export {
  SmsException,
  UnsupportedDriverException,
  SmsDriverException,
  ConfigurationException,
  MissingConfigException,
  MessageValidationException,
  RateLimitException,
  HttpException,
} from "./exceptions/sms-exceptions";

// Drivers
export { BaseSmsDriver } from "./drivers/base-driver";
export { KavenegarDriver } from "./drivers/kavenegar-driver";
export { SmsIrDriver } from "./drivers/smsir-driver";
export { MelipayamakDriver } from "./drivers/melipayamak-driver";
export { IppanelDriver } from "./drivers/ippanel-driver";
export { MockDriver } from "./drivers/mock-driver";

// Convenience factory functions
import { SmsService } from "./services/sms-service";
import { SmsConfigManager } from "./config/sms-config";
import { ISmsConfig } from "./interfaces/sms-config.interface";

export const createSmsService = (config: ISmsConfig) => new SmsService(config);

export const createMockSmsService = (options?: {
  shouldFail?: boolean;
  delay?: number;
}) => new SmsService(SmsConfigManager.createForTesting(options));

export const createKavenegarSmsService = (options: {
  apiKey: string;
  lineNumber: string;
  url?: string;
}): SmsService =>
  new SmsService(SmsConfigManager.createKavenegarConfig(options));

export const createSmsIrSmsService = (options: {
  apiKey: string;
  lineNumber: string;
  url?: string;
}): SmsService => new SmsService(SmsConfigManager.createSmsIrConfig(options));

export const createMelipayamakSmsService = (options: {
  apiKey: string;
  lineNumber: string;
  url?: string;
}): SmsService =>
  new SmsService(SmsConfigManager.createMelipayamakConfig(options));

export const createIppanelSmsService = (options: {
  apiKey: string;
  lineNumber: string;
  url?: string;
}): SmsService => new SmsService(SmsConfigManager.createIppanelConfig(options));
