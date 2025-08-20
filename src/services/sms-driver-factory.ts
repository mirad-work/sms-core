import { ISmsDriver } from "../interfaces/sms-driver.interface";
import { ISmsConfig } from "../interfaces/sms-config.interface";
import { IHttpClient } from "../interfaces/http-client.interface";
import { DriverType } from "../types/driver-types";
import {
  UnsupportedDriverException,
  ConfigurationException,
  MissingConfigException,
} from "../exceptions/sms-exceptions";
import { HttpClient } from "../utils/http-client";

/**
 * Factory class for creating SMS driver instances
 * Implements the Factory pattern for driver instantiation
 */
export class SmsDriverFactory {
  private readonly config: ISmsConfig;
  private readonly httpClient: IHttpClient;
  private readonly driverInstances: Map<DriverType, ISmsDriver> = new Map();

  constructor(config: ISmsConfig, httpClient?: IHttpClient) {
    this.validateConfig(config);
    this.config = config;
    this.httpClient = httpClient || new HttpClient(config.timeout);
  }

  /**
   * Create a driver instance for the specified driver type
   * Uses singleton pattern to reuse driver instances
   */
  createDriver(driverType?: DriverType): ISmsDriver {
    const driver = driverType || this.config.defaultDriver;

    // Return cached instance if available
    if (this.driverInstances.has(driver)) {
      return this.driverInstances.get(driver)!;
    }

    // Create new instance
    const driverInstance = this.instantiateDriver(driver);

    // Cache the instance
    this.driverInstances.set(driver, driverInstance);

    return driverInstance;
  }

  /**
   * Clear driver cache (useful for testing or config changes)
   */
  clearCache(): void {
    this.driverInstances.clear();
  }

  /**
   * Get list of available drivers based on configuration
   */
  getAvailableDrivers(): DriverType[] {
    const available: DriverType[] = [];

    Object.keys(this.config.drivers).forEach((key) => {
      const driverKey = key as keyof typeof this.config.drivers;
      if (this.config.drivers[driverKey]) {
        available.push(key as DriverType);
      }
    });

    return available;
  }

  /**
   * Check if a driver is available and properly configured
   */
  isDriverAvailable(driverType: DriverType): boolean {
    try {
      this.validateDriverConfig(driverType);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Instantiate the actual driver based on type
   */
  private instantiateDriver(driverType: DriverType): ISmsDriver {
    this.validateDriverConfig(driverType);

    switch (driverType) {
      case DriverType.KAVENEGAR: {
        // Dynamic import to avoid circular dependencies
        const { KavenegarDriver } = require("../drivers/kavenegar-driver");
        return new KavenegarDriver(
          this.config.drivers.kavenegar!,
          this.httpClient,
        );
      }

      case DriverType.SMSIR: {
        const { SmsIrDriver } = require("../drivers/smsir-driver");
        return new SmsIrDriver(this.config.drivers.smsir!, this.httpClient);
      }

      case DriverType.MELIPAYAMAK: {
        const { MelipayamakDriver } = require("../drivers/melipayamak-driver");
        return new MelipayamakDriver(
          this.config.drivers.melipayamak!,
          this.httpClient,
        );
      }

      case DriverType.MOCK: {
        const { MockDriver } = require("../drivers/mock-driver");
        return new MockDriver(this.config.drivers.mock || {}, this.httpClient);
      }

      default:
        throw new UnsupportedDriverException(driverType);
    }
  }

  /**
   * Validate the main configuration
   */
  private validateConfig(config: ISmsConfig): void {
    if (!config) {
      throw new ConfigurationException("SMS configuration is required");
    }

    if (!config.defaultDriver) {
      throw new MissingConfigException("defaultDriver");
    }

    if (!config.drivers || Object.keys(config.drivers).length === 0) {
      throw new ConfigurationException(
        "At least one driver configuration is required",
      );
    }

    // Validate that default driver is configured
    if (!config.drivers[config.defaultDriver]) {
      throw new ConfigurationException(
        `Default driver '${config.defaultDriver}' is not configured`,
      );
    }
  }

  /**
   * Validate configuration for a specific driver
   */
  private validateDriverConfig(driverType: DriverType): void {
    const driverConfig = this.config.drivers[driverType];

    if (!driverConfig) {
      throw new ConfigurationException(
        `Driver '${driverType}' is not configured`,
      );
    }

    switch (driverType) {
      case DriverType.KAVENEGAR:
      case DriverType.SMSIR:
      case DriverType.MELIPAYAMAK:
        this.validateBasicDriverConfig(driverConfig, driverType);
        break;

      case DriverType.MOCK:
        // Mock driver doesn't require specific config
        break;

      default:
        throw new UnsupportedDriverException(driverType);
    }
  }

  /**
   * Validate basic driver configuration (url, apiKey, lineNumber)
   */
  private validateBasicDriverConfig(
    driverConfig: unknown,
    driverType: DriverType,
  ): void {
    if (!driverConfig || typeof driverConfig !== "object") {
      throw new ConfigurationException(
        `Driver '${driverType}' configuration must be an object`,
      );
    }

    const config = driverConfig as Record<string, unknown>;

    if (!config.url || typeof config.url !== "string") {
      throw new ConfigurationException(
        `Driver '${driverType}' requires a valid url`,
      );
    }

    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new ConfigurationException(
        `Driver '${driverType}' requires a valid apiKey`,
      );
    }

    if (!config.lineNumber || typeof config.lineNumber !== "string") {
      throw new ConfigurationException(
        `Driver '${driverType}' requires a valid lineNumber`,
      );
    }
  }
}
