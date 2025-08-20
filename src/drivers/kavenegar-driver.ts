import { BaseSmsDriver } from "./base-driver";
import { ISmsMessage, ISmsResponse } from "../interfaces/sms-driver.interface";
import { IKavenegarConfig } from "../interfaces/sms-config.interface";
import { IHttpClient } from "../interfaces/http-client.interface";
import { buildUrlWithParams } from "../utils/url-utils";

/**
 * Kavenegar SMS API response structures
 */
interface KavenegarApiResponse {
  return: {
    status: number;
    message: string;
  };
  entries?: Array<{
    messageid: number;
    message: string;
    status: number;
    statustext: string;
    sender: string;
    receptor: string;
    date: number;
    cost: number;
  }>;
}

/**
 * Kavenegar verification payload structure
 */
interface KavenegarVerifyPayload extends Record<string, unknown> {
  receptor: string;
  template: string;
  token?: string;
  token2?: string;
  token3?: string;
  token10?: string;
  token20?: string;
}

/**
 * Kavenegar SMS driver implementation
 * Implements the Iranian Kavenegar SMS API
 */
export class KavenegarDriver extends BaseSmsDriver {
  private readonly kavenegarConfig: IKavenegarConfig;

  constructor(config: IKavenegarConfig, httpClient: IHttpClient) {
    super(config, httpClient);
    this.kavenegarConfig = config;
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
      const baseUrl = this.buildUrl(
        `${this.kavenegarConfig.apiKey}/verify/lookup.json`,
      );

      const payload = this.buildVerifyPayload(message);
      const url = buildUrlWithParams(baseUrl, payload);

      this.log("info", "Sending verification SMS via Kavenegar", {
        to: message.to,
        template: message.template,
      });

      const response = await this.handleHttpRequest(() =>
        this.httpClient.get<KavenegarApiResponse>(url, {
          headers: this.buildHeaders(),
        }),
      );

      return this.processKavenegarResponse(response.data);
    } catch (error) {
      const err = error as Error;
      this.log("error", "SMS verify failed", { error: err.message });
      return this.createErrorResponse(err.message, "VERIFY_FAILED");
    }
  }

  /**
   * Build payload for verify/OTP requests
   */
  private buildVerifyPayload(message: ISmsMessage): KavenegarVerifyPayload {
    const payload: KavenegarVerifyPayload = {
      receptor: message.to,
      template: message.template!,
    };

    // Handle different token formats
    if (Array.isArray(message.tokens)) {
      // Positional tokens
      const tokens = message.tokens as unknown[];
      if (tokens[0] !== undefined) payload.token = String(tokens[0]);
      if (tokens[1] !== undefined) payload.token2 = String(tokens[1]);
      if (tokens[2] !== undefined) payload.token3 = String(tokens[2]);
      if (tokens[3] !== undefined) payload.token10 = String(tokens[3]);
      if (tokens[4] !== undefined) payload.token20 = String(tokens[4]);
    } else {
      // Named tokens (convert to Kavenegar format)
      const tokens = message.tokens as Record<string, unknown>;
      if (tokens.token || tokens.code) {
        payload.token = String(tokens.token || tokens.code);
      }
      if (tokens.token2) payload.token2 = String(tokens.token2);
      if (tokens.token3) payload.token3 = String(tokens.token3);
      if (tokens.token10) payload.token10 = String(tokens.token10);
      if (tokens.token20) payload.token20 = String(tokens.token20);
    }

    return payload;
  }

  /**
   * Process Kavenegar API response and convert to standard format
   */
  private processKavenegarResponse(
    response: KavenegarApiResponse,
  ): ISmsResponse {
    if (response.return.status === 200) {
      const messageId = response.entries?.[0]?.messageid?.toString();
      return this.createSuccessResponse(response, messageId);
    } else {
      const errorMessage = response.return.message || "Unknown error";
      return this.createErrorResponse(
        errorMessage,
        `KAVENEGAR_${response.return.status}`,
        response,
      );
    }
  }
}
