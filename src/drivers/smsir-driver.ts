import { BaseSmsDriver } from "./base-driver";
import { ISmsMessage, ISmsResponse } from "../interfaces/sms-driver.interface";
import { ISmsIrConfig } from "../interfaces/sms-config.interface";
import { IHttpClient } from "../interfaces/http-client.interface";

/**
 * SMS.ir API response structures
 */
interface SmsIrApiResponse {
  status: number;
  message: string;
  data?: {
    messageId?: string;
    cost?: number;
  };
}

/**
 * SMS.ir verification payload structure
 */
interface SmsIrVerifyPayload extends Record<string, unknown> {
  mobile: string;
  templateId: string;
  parameters: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * SMS.ir SMS driver implementation
 * Implements the Iranian SMS.ir API
 */
export class SmsIrDriver extends BaseSmsDriver {
  private readonly smsIrConfig: ISmsIrConfig;

  constructor(config: ISmsIrConfig, httpClient: IHttpClient) {
    super(config, httpClient);
    this.smsIrConfig = config;
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
      const url = this.buildUrl("send/verify");
      const payload = this.buildVerifyPayload(message);

      this.log("info", "Sending verification SMS via SMS.ir", {
        to: message.to,
        template: message.template,
      });

      const response = await this.handleHttpRequest(() =>
        this.httpClient.post<SmsIrApiResponse>(url, payload, {
          headers: this.buildHeaders({
            "X-API-KEY": this.smsIrConfig.apiKey,
          }),
        }),
      );

      return this.processSmsIrResponse(response.data);
    } catch (error) {
      const err = error as Error;
      this.log("error", "SMS verify failed", { error: err.message });
      return this.createErrorResponse(err.message, "VERIFY_FAILED");
    }
  }

  /**
   * Build payload for verify/OTP requests
   */
  private buildVerifyPayload(message: ISmsMessage): SmsIrVerifyPayload {
    const parameters: Array<{ name: string; value: string }> = [];

    // Handle different token formats
    if (Array.isArray(message.tokens)) {
      // Positional tokens
      const tokens = message.tokens as unknown[];
      tokens.forEach((token, index) => {
        if (token !== undefined) {
          parameters.push({
            name: `Parameter${index + 1}`,
            value: String(token),
          });
        }
      });
    } else {
      // Named tokens
      const tokens = message.tokens as Record<string, unknown>;
      Object.entries(tokens).forEach(([name, value]) => {
        if (value !== undefined) {
          parameters.push({
            name,
            value: String(value),
          });
        }
      });
    }

    return {
      mobile: message.to,
      templateId: message.template!,
      parameters,
    };
  }

  /**
   * Process SMS.ir API response and convert to standard format
   */
  private processSmsIrResponse(response: SmsIrApiResponse): ISmsResponse {
    if (response.status === 1) {
      // SMS.ir uses status 1 for success
      const messageId = response.data?.messageId;
      return this.createSuccessResponse(response, messageId);
    } else {
      const errorMessage = response.message || "Unknown error";
      return this.createErrorResponse(
        errorMessage,
        `SMSIR_${response.status}`,
        response,
      );
    }
  }
}
