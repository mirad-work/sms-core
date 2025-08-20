import { BaseSmsDriver } from "./base-driver";
import { ISmsMessage, ISmsResponse } from "../interfaces/sms-driver.interface";
import { IMelipayamakConfig } from "../interfaces/sms-config.interface";
import { IHttpClient } from "../interfaces/http-client.interface";

/**
 * Melipayamak API response structures
 */
interface MelipayamakApiResponse {
  recId: string;
  status: string;
}

/**
 * Melipayamak verification payload structure
 */
interface MelipayamakVerifyPayload {
  to: string;
  bodyId: string;
  args: string[];
}

/**
 * Melipayamak SMS driver implementation
 * Implements the Iranian Melipayamak SMS API
 */
export class MelipayamakDriver extends BaseSmsDriver {
  private readonly melipayamakConfig: IMelipayamakConfig;

  constructor(config: IMelipayamakConfig, httpClient: IHttpClient) {
    super(config, httpClient);
    this.melipayamakConfig = config;
  }

  /**
   * Override buildUrl to append API key at the end of the URL
   */
  protected buildUrl(endpoint: string): string {
    const baseUrl = super.buildUrl(endpoint);
    return `${baseUrl}/${this.melipayamakConfig.apiKey}`;
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
      const url = this.buildUrl("send/shared");
      const payload = this.buildVerifyPayload(message);

      this.log("info", "Sending verification SMS via Melipayamak", {
        to: message.to,
        template: message.template,
      });

      const response = await this.handleHttpRequest(() =>
        this.httpClient.post<MelipayamakApiResponse>(url, payload, {
          headers: this.buildHeaders(),
        }),
      );

      return this.processMelipayamakResponse(response.data);
    } catch (error) {
      const err = error as Error;
      this.log("error", "SMS verify failed", { error: err.message });
      return this.createErrorResponse(err.message, "VERIFY_FAILED");
    }
  }

  /**
   * Build payload for verify/OTP requests
   */
  private buildVerifyPayload(message: ISmsMessage): MelipayamakVerifyPayload {
    const args: string[] = [];

    // Handle different token formats
    if (Array.isArray(message.tokens)) {
      // Positional tokens
      const tokens = message.tokens as unknown[];
      tokens.forEach((token) => {
        if (token !== undefined) {
          args.push(String(token));
        }
      });
    } else {
      // Named tokens - convert to array based on common parameter names
      const tokens = message.tokens as Record<string, unknown>;

      // Common token names for Melipayamak
      const paramNames = [
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
        "ten",
      ];

      // First try to get tokens in the expected order
      paramNames.forEach((name) => {
        if (tokens[name] !== undefined) {
          args.push(String(tokens[name]));
        }
      });

      // If no standard names found, use all values
      if (args.length === 0) {
        Object.values(tokens).forEach((value) => {
          if (value !== undefined) {
            args.push(String(value));
          }
        });
      }
    }

    return {
      to: message.to,
      bodyId: message.template!,
      args,
    };
  }

  /**
   * Process Melipayamak API response and convert to standard format
   */
  private processMelipayamakResponse(
    response: MelipayamakApiResponse,
  ): ISmsResponse {
    if (response.status === "ارسال موفق بود") {
      // Melipayamak uses RetStatus 1 for success
      const messageId = response.recId; // Message ID is in the Value field
      return this.createSuccessResponse(response, messageId);
    } else {
      const errorMessage = response.status || "Unknown error";
      return this.createErrorResponse(
        errorMessage,
        `MELIPAYAMAK_${response.status}`,
        response,
      );
    }
  }
}
