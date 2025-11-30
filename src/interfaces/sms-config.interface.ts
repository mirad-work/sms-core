import { DriverType } from "../types/driver-types";

/**
 * Kavenegar provider configuration
 */
export interface IKavenegarConfig {
  url: string;
  apiKey: string;
  lineNumber: string;
}

/**
 * SMS.ir provider configuration
 */
export interface ISmsIrConfig {
  url: string;
  apiKey: string;
  lineNumber: string;
}

/**
 * Melipayamak provider configuration
 */
export interface IMelipayamakConfig {
  url: string;
  apiKey: string;
  lineNumber: string;
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
}

/**
 * Main SMS service configuration
 */
export interface ISmsConfig {
  /** Default driver to use when none is specified */
  defaultDriver: DriverType;
  /** Global timeout for HTTP requests (in milliseconds) */
  timeout?: number;
  /** Provider-specific configurations */
  drivers: {
    kavenegar?: IKavenegarConfig;
    smsir?: ISmsIrConfig;
    melipayamak?: IMelipayamakConfig;
    ippanel?: IIppanelConfig;
    mock?: IMockConfig;
  };
}
