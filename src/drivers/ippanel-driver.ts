import { BaseSmsDriver } from "./base-driver";
import { ISmsMessage, ISmsResponse } from "../interfaces/sms-driver.interface";
import { IIppanelConfig } from "../interfaces/sms-config.interface";
import { IHttpClient } from "../interfaces/http-client.interface";
import { HttpException } from "../exceptions/sms-exceptions";

/**
 * IPPanel API response structures
 */
interface IppanelApiResponse {
  status: string;
  code: number;
  errorMessage?:
    | string
    | {
        code?: string[];
        [key: string]: unknown;
      };
  data?: {
    messageId?: string;
    [key: string]: unknown;
  };
}

/**
 * IPPanel verification payload structure
 */
interface IppanelVerifyPayload {
  code: string;
  sender: string;
  recipient: string;
  variable: Record<string, string>;
}

/**
 * IPPanel SMS driver implementation
 * Implements the Iranian IPPanel SMS API
 */
export class IppanelDriver extends BaseSmsDriver {
  private readonly ippanelConfig: IIppanelConfig;

  constructor(config: IIppanelConfig, httpClient: IHttpClient) {
    super(config, httpClient);
    this.ippanelConfig = config;
  }

  /**
   * Build headers with API key for IPPanel requests
   */
  protected buildHeaders(
    additionalHeaders: Record<string, string> = {},
  ): Record<string, string> {
    return {
      ...super.buildHeaders(),
      apikey: this.ippanelConfig.apiKey,
      ...additionalHeaders,
    };
  }

  /**
   * Send a template-based SMS message (OTP/verification)
   */
  async verify(message: ISmsMessage): Promise<ISmsResponse> {
    this.validateMessage(message);

    if (!message.template) {
      return this.createErrorResponse(
        "Template is required for verify operation",
        "MISSING_TEMPLATE",
      );
    }

    if (!message.tokens) {
      return this.createErrorResponse(
        "Tokens are required for verify operation",
        "MISSING_TOKENS",
      );
    }

    try {
      const url = this.buildUrl("api/v1/sms/pattern/normal/send");
      const payload = this.buildVerifyPayload(message);

      this.log("info", "Sending verification SMS via IPPanel", {
        to: message.to,
        template: message.template,
      });

      const response = await this.handleHttpRequest(() =>
        this.httpClient.post<IppanelApiResponse>(url, payload, {
          headers: this.buildHeaders(),
        }),
      );

      return this.processIppanelResponse(response.data);
    } catch (error) {
      // Check if it's an HttpException with response data that might be IPPanel response
      if (error instanceof HttpException && error._originalError) {
        // Try to parse the original error as IPPanel response
        const responseData = error._originalError as unknown;
        if (
          responseData &&
          typeof responseData === "object" &&
          "code" in responseData
        ) {
          return this.processIppanelResponse(
            responseData as IppanelApiResponse,
          );
        }
      }

      const err = error as Error;
      this.log("error", "SMS verify failed", { error: err.message });
      return this.createErrorResponse(err.message, "VERIFY_FAILED");
    }
  }

  /**
   * Build payload for verify/OTP requests
   */
  private buildVerifyPayload(message: ISmsMessage): IppanelVerifyPayload {
    const variable: Record<string, string> = {};

    // Handle different token formats
    if (Array.isArray(message.tokens)) {
      // Positional tokens - convert to named variables
      const tokens = message.tokens as unknown[];
      tokens.forEach((token, index) => {
        if (token !== undefined) {
          // Use common variable names based on position
          const varName = index === 0 ? "name" : `var${index + 1}`;
          variable[varName] = String(token);
        }
      });
    } else {
      // Named tokens - use as is
      const tokens = message.tokens as Record<string, unknown>;
      Object.entries(tokens).forEach(([name, value]) => {
        if (value !== undefined) {
          variable[name] = String(value);
        }
      });
    }

    // Use sender from message or fallback to config lineNumber
    const sender = message.from || this.ippanelConfig.lineNumber;

    return {
      code: message.template!,
      sender,
      recipient: message.to,
      variable,
    };
  }

  /**
   * Process IPPanel API response and convert to standard format
   */
  private processIppanelResponse(response: IppanelApiResponse): ISmsResponse {
    // IPPanel returns 200 status code for successful requests
    // Check the response status field for business logic status
    if (response.code === 200) {
      const messageId = response.data?.messageId as string | undefined;
      return this.createSuccessResponse(response, messageId);
    } else {
      // Handle different error formats
      let errorMessage = "Unknown error";

      if (typeof response.errorMessage === "string") {
        errorMessage = response.errorMessage;
      } else if (
        response.errorMessage &&
        typeof response.errorMessage === "object"
      ) {
        // Handle validation errors (422) where errorMessage is an object
        const errorObj = response.errorMessage as Record<string, unknown>;
        const errorMessages: string[] = [];

        Object.entries(errorObj).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            errorMessages.push(`${key}: ${value.join(", ")}`);
          } else {
            errorMessages.push(`${key}: ${String(value)}`);
          }
        });

        errorMessage = errorMessages.join("; ") || "Unknown error";
      } else if (response.status) {
        errorMessage = response.status;
      }

      return this.createErrorResponse(
        errorMessage,
        `IPPANEL_${response.code}`,
        response,
      );
    }
  }
}
