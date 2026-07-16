import { ISmsConfig } from "../interfaces/sms-config.interface";
import { DriverType } from "../types/driver-types";
import {
  ConfigurationException,
  MissingConfigException,
} from "../exceptions/sms-exceptions";

/**
 * Configuration manager for SMS service
 * Supports environment variables, config objects, and default values
 */
export class SmsConfigManager {
  /**
   * Parse a numeric environment variable, falling back to a default when the
   * value is absent or not a usable number.
   *
   * Without this, a malformed value (e.g. SMS_TIMEOUT=fast) yields NaN, which
   * silently aborts every request because setTimeout(fn, NaN) fires immediately.
   */
  private static parseNumber(
    value: string | undefined,
    fallback: number,
    { allowZero = false }: { allowZero?: boolean } = {},
  ): number {
    if (value === undefined || value.trim() === "") {
      return fallback;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }

    if (parsed === 0 && !allowZero) {
      return fallback;
    }

    return parsed;
  }

  /**
   * Create configuration from environment variables
   */
  static fromEnvironment(): ISmsConfig {
    const defaultDriver =
      (process.env.SMS_DEFAULT_DRIVER as DriverType) || DriverType.KAVENEGAR;
    const timeout = this.parseNumber(process.env.SMS_TIMEOUT, 10000);

    const config: ISmsConfig = {
      defaultDriver,
      timeout,
      drivers: {},
    };

    // Kavenegar configuration
    if (process.env.SMS_KAVENEGAR_URL || process.env.SMS_KAVENEGAR_API_KEY) {
      config.drivers.kavenegar = {
        url: process.env.SMS_KAVENEGAR_URL || "https://api.kavenegar.com/v1/",
        apiKey: process.env.SMS_KAVENEGAR_API_KEY || "",
        lineNumber: process.env.SMS_KAVENEGAR_LINE_NUMBER || "",
      };
    }

    // SMS.ir configuration
    if (process.env.SMS_SMSIR_URL || process.env.SMS_SMSIR_API_KEY) {
      config.drivers.smsir = {
        url: process.env.SMS_SMSIR_URL || "https://api.sms.ir/v1/",
        apiKey: process.env.SMS_SMSIR_API_KEY || "",
        lineNumber: process.env.SMS_SMSIR_LINE_NUMBER || "",
      };
    }

    // Melipayamak configuration
    if (
      process.env.SMS_MELIPAYAMAK_URL ||
      process.env.SMS_MELIPAYAMAK_USERNAME ||
      process.env.SMS_MELIPAYAMAK_PASSWORD ||
      process.env.SMS_MELIPAYAMAK_API_KEY
    ) {
      config.drivers.melipayamak = {
        url:
          process.env.SMS_MELIPAYAMAK_URL ||
          "https://rest.payamak-panel.com/api/SendSMS/",
        username: process.env.SMS_MELIPAYAMAK_USERNAME || "",
        password:
          process.env.SMS_MELIPAYAMAK_PASSWORD ||
          process.env.SMS_MELIPAYAMAK_API_KEY ||
          "",
      };
    }

    // IPPanel configuration
    if (process.env.SMS_IPPANEL_URL || process.env.SMS_IPPANEL_API_KEY) {
      config.drivers.ippanel = {
        url: process.env.SMS_IPPANEL_URL || "https://api2.ippanel.com/",
        apiKey: process.env.SMS_IPPANEL_API_KEY || "",
        lineNumber: process.env.SMS_IPPANEL_LINE_NUMBER || "",
      };
    }

    // Mock driver configuration (for testing)
    if (
      process.env.NODE_ENV === "test" ||
      process.env.SMS_USE_MOCK === "true"
    ) {
      config.drivers.mock = {
        shouldFail: process.env.SMS_MOCK_SHOULD_FAIL === "true",
        delay: this.parseNumber(process.env.SMS_MOCK_DELAY, 0, {
          allowZero: true,
        }),
      };
    }

    return config;
  }

  /**
   * Create configuration with validation
   */
  static create(config: Partial<ISmsConfig>): ISmsConfig {
    const fullConfig: ISmsConfig = {
      defaultDriver: config.defaultDriver || DriverType.KAVENEGAR,
      timeout: config.timeout || 10000,
      drivers: config.drivers || {},
    };

    this.validateConfig(fullConfig);
    return fullConfig;
  }

  /**
   * Create a simple configuration for testing with mock driver
   */
  static createForTesting(
    options: {
      shouldFail?: boolean;
      delay?: number;
    } = {},
  ): ISmsConfig {
    return {
      defaultDriver: DriverType.MOCK,
      timeout: 5000,
      drivers: {
        mock: {
          shouldFail: options.shouldFail || false,
          delay: options.delay || 0,
        },
      },
    };
  }

  /**
   * Create configuration for Kavenegar
   */
  static createKavenegarConfig(options: {
    apiKey: string;
    lineNumber: string;
    url?: string;
  }): ISmsConfig {
    return {
      defaultDriver: DriverType.KAVENEGAR,
      timeout: 10000,
      drivers: {
        kavenegar: {
          url: options.url || "https://api.kavenegar.com/v1/",
          apiKey: options.apiKey,
          lineNumber: options.lineNumber,
        },
      },
    };
  }

  /**
   * Create configuration for SMS.ir
   */
  static createSmsIrConfig(options: {
    apiKey: string;
    lineNumber: string;
    url?: string;
  }): ISmsConfig {
    return {
      defaultDriver: DriverType.SMSIR,
      timeout: 10000,
      drivers: {
        smsir: {
          url: options.url || "https://api.sms.ir/v1/",
          apiKey: options.apiKey,
          lineNumber: options.lineNumber,
        },
      },
    };
  }

  /**
   * Create configuration for Melipayamak
   */
  static createMelipayamakConfig(options: {
    username: string;
    password: string;
    url?: string;
  }): ISmsConfig {
    return {
      defaultDriver: DriverType.MELIPAYAMAK,
      timeout: 10000,
      drivers: {
        melipayamak: {
          url: options.url || "https://rest.payamak-panel.com/api/SendSMS/",
          username: options.username,
          password: options.password,
        },
      },
    };
  }

  /**
   * Create configuration for IPPanel
   */
  static createIppanelConfig(options: {
    apiKey: string;
    lineNumber: string;
    url?: string;
  }): ISmsConfig {
    return {
      defaultDriver: DriverType.IPPANEL,
      timeout: 10000,
      drivers: {
        ippanel: {
          url: options.url || "https://api2.ippanel.com/",
          apiKey: options.apiKey,
          lineNumber: options.lineNumber,
        },
      },
    };
  }

  /**
   * Merge multiple configurations
   */
  static merge(...configs: Partial<ISmsConfig>[]): ISmsConfig {
    const mergedConfig: ISmsConfig = {
      defaultDriver: DriverType.KAVENEGAR,
      timeout: 10000,
      drivers: {},
    };

    for (const config of configs) {
      if (config.defaultDriver) {
        mergedConfig.defaultDriver = config.defaultDriver;
      }
      if (config.timeout) {
        mergedConfig.timeout = config.timeout;
      }
      if (config.drivers) {
        Object.assign(mergedConfig.drivers, config.drivers);
      }
    }

    this.validateConfig(mergedConfig);
    return mergedConfig;
  }

  /**
   * Validate configuration
   */
  private static validateConfig(config: ISmsConfig): void {
    if (!config.defaultDriver) {
      throw new MissingConfigException("defaultDriver");
    }

    if (!config.drivers || Object.keys(config.drivers).length === 0) {
      throw new ConfigurationException(
        "At least one driver must be configured",
      );
    }

    // Validate that default driver is configured
    if (!config.drivers[config.defaultDriver]) {
      throw new ConfigurationException(
        `Default driver '${config.defaultDriver}' is not configured`,
      );
    }

    // Validate individual driver configurations
    Object.entries(config.drivers).forEach(([driverType, driverConfig]) => {
      if (!driverConfig) return;

      switch (driverType as DriverType) {
        case DriverType.KAVENEGAR:
        case DriverType.SMSIR:
        case DriverType.IPPANEL: {
          const basicDriverConfig = driverConfig as unknown;
          const config = basicDriverConfig as {
            url?: string;
            apiKey?: string;
            lineNumber?: string;
          };
          if (!config.url || !config.apiKey || !config.lineNumber) {
            throw new ConfigurationException(
              `Driver '${driverType}' requires url, apiKey, and lineNumber`,
            );
          }
          break;
        }

        case DriverType.MELIPAYAMAK: {
          const melipayamakConfig = driverConfig as {
            url?: string;
            username?: string;
            password?: string;
          };
          if (
            !melipayamakConfig.url ||
            !melipayamakConfig.username ||
            !melipayamakConfig.password
          ) {
            throw new ConfigurationException(
              "Driver 'melipayamak' requires url, username, and password",
            );
          }
          break;
        }

        case DriverType.MOCK:
          // Mock driver doesn't require specific validation
          break;

        default:
          throw new ConfigurationException(
            `Unknown driver type: ${driverType}`,
          );
      }
    });
  }

  /**
   * Get sample environment variables
   */
  static getSampleEnvVars(): string {
    return `
# SMS Service Configuration
SMS_DEFAULT_DRIVER=kavenegar
SMS_TIMEOUT=10000

# Kavenegar Configuration
SMS_KAVENEGAR_URL=https://api.kavenegar.com/v1/
SMS_KAVENEGAR_API_KEY=your-kavenegar-api-key
SMS_KAVENEGAR_LINE_NUMBER=your-line-number

# SMS.ir Configuration
SMS_SMSIR_URL=https://api.sms.ir/v1/
SMS_SMSIR_API_KEY=your-smsir-api-key
SMS_SMSIR_LINE_NUMBER=your-line-number

# Melipayamak Configuration
SMS_MELIPAYAMAK_URL=https://rest.payamak-panel.com/api/SendSMS/
SMS_MELIPAYAMAK_USERNAME=your-melipayamak-username
SMS_MELIPAYAMAK_PASSWORD=your-melipayamak-password-or-api-key

# IPPanel Configuration
SMS_IPPANEL_URL=https://api2.ippanel.com/
SMS_IPPANEL_API_KEY=your-ippanel-api-key
SMS_IPPANEL_LINE_NUMBER=your-line-number

# Mock Driver Configuration (for testing)
SMS_USE_MOCK=false
SMS_MOCK_SHOULD_FAIL=false
SMS_MOCK_DELAY=0
`.trim();
  }
}
