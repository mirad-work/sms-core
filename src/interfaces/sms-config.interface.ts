import { DriverType } from "../types/driver-types";
import { ISmsFallbackConfig } from "./sms-fallback.interface";

/**
 * Kavenegar provider configuration
 */
export interface IKavenegarConfig {
  url: string;
  apiKey: string;
  lineNumber?: string;
}

/**
 * SMS.ir provider configuration
 */
export interface ISmsIrConfig {
  url: string;
  apiKey: string;
  lineNumber?: string;
}

/**
 * Melipayamak provider configuration
 */
export interface IMelipayamakConfig {
  url: string;
  username: string;
  password: string;
}

/**
 * IPPanel provider configuration
 */
export interface IIppanelConfig {
  url: string;
  apiKey: string;
  lineNumber: string;
}

/**
 * Mock driver configuration (for testing)
 */
export interface IMockConfig {
  shouldFail?: boolean;
  delay?: number;
  failureMode?: "rejected" | "timeout" | "network" | "unexpected";
}

/**
 * Main SMS service configuration
 */
export interface ISmsConfig {
  /** Default driver to use when none is specified */
  defaultDriver: DriverType;
  /** Global timeout for HTTP requests (in milliseconds) */
  timeout?: number;
  /** Explicit opt-in multi-provider submission fallback policy. */
  fallback?: ISmsFallbackConfig;
  /** Provider-specific configurations */
  drivers: {
    kavenegar?: IKavenegarConfig;
    smsir?: ISmsIrConfig;
    melipayamak?: IMelipayamakConfig;
    ippanel?: IIppanelConfig;
    mock?: IMockConfig;
  };
}
