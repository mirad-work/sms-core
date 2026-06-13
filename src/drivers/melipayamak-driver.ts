import { BaseSmsDriver } from "./base-driver";
import { ISmsMessage, ISmsResponse } from "../interfaces/sms-driver.interface";
import { IMelipayamakConfig } from "../interfaces/sms-config.interface";
import { IHttpClient } from "../interfaces/http-client.interface";

/**
 * Melipayamak BaseServiceNumber REST API response
 */
interface MelipayamakApiResponse {
  Value: string;
  RetStatus: number;
  StrRetStatus: string;
}

/**
 * Melipayamak BaseServiceNumber request payload
 */
interface MelipayamakVerifyPayload extends Record<string, string> {
  username: string;
  password: string;
  text: string;
  to: string;
  bodyId: string;
}

const MELIPAYAMAK_ERROR_MESSAGES: Record<string, string> = {
  "0": "Invalid username or password",
  "1": "Access to this web service is disabled",
  "2": "Only one mobile number is allowed per request",
  "3": "Sender line is not defined in the system",
  "4": "Invalid or unapproved template bodyId",
  "5": "Template variables do not match the approved pattern",
  "6": "Internal error, contact support",
  "-5": "Insufficient credit",
  "-6": "System is being updated",
  "-7": "Message contains filtered words",
  "-10": "User account is not active",
  "-11": "Message was not sent",
  "-12": "User documents are incomplete",
  "-18": "Invalid mobile number",
  "-19": "Daily web service send limit reached",
  "108": "IP blocked due to failed API attempts",
  "109": "Allowed IP must be configured for API usage",
  "110": "ApiKey must be used instead of password",
};

/**
 * Melipayamak SMS driver implementation
 * Uses the REST BaseServiceNumber API for shared-service template messages
 */
export class MelipayamakDriver extends BaseSmsDriver {
  private readonly melipayamakConfig: IMelipayamakConfig;

  constructor(config: IMelipayamakConfig, httpClient: IHttpClient) {
    super(config, httpClient);
    this.melipayamakConfig = config;
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
      const url = this.buildUrl("BaseServiceNumber");
      const payload = this.buildVerifyPayload(message);

      this.log("info", "Sending verification SMS via Melipayamak", {
        to: message.to,
        template: message.template,
      });

      const response = await this.handleHttpRequest(() =>
        this.httpClient.request<MelipayamakApiResponse>({
          method: "POST",
          url,
          data: new URLSearchParams(payload),
          headers: {
            ...this.buildHeaders(),
            "Content-Type": "application/x-www-form-urlencoded",
          },
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
   * Build payload for BaseServiceNumber requests
   */
  private buildVerifyPayload(message: ISmsMessage): MelipayamakVerifyPayload {
    return {
      username: this.melipayamakConfig.username,
      password: this.melipayamakConfig.password,
      text: this.buildTemplateText(message.tokens!),
      to: message.to,
      bodyId: message.template!,
    };
  }

  /**
   * Convert tokens to semicolon-separated template variables
   */
  private buildTemplateText(
    tokens: Record<string, unknown> | unknown[],
  ): string {
    const args: string[] = [];

    if (Array.isArray(tokens)) {
      tokens.forEach((token) => {
        if (token !== undefined) {
          args.push(String(token));
        }
      });
    } else {
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

      paramNames.forEach((name) => {
        if (tokens[name] !== undefined) {
          args.push(String(tokens[name]));
        }
      });

      if (args.length === 0) {
        Object.values(tokens).forEach((value) => {
          if (value !== undefined) {
            args.push(String(value));
          }
        });
      }
    }

    return args.join(";");
  }

  /**
   * Process Melipayamak API response and convert to standard format
   */
  private processMelipayamakResponse(
    response: MelipayamakApiResponse,
  ): ISmsResponse {
    if (this.isSuccessResponse(response)) {
      return this.createSuccessResponse(response, response.Value);
    }

    const errorCode = response.Value;
    const errorMessage =
      MELIPAYAMAK_ERROR_MESSAGES[errorCode] ||
      `Melipayamak error: ${errorCode || response.StrRetStatus}`;

    return this.createErrorResponse(
      errorMessage,
      `MELIPAYAMAK_${errorCode || response.RetStatus}`,
      response,
    );
  }

  private isSuccessResponse(response: MelipayamakApiResponse): boolean {
    if (
      response.RetStatus === 1 &&
      response.StrRetStatus?.toLowerCase() === "ok"
    ) {
      return true;
    }

    return /^\d{16,}$/.test(response.Value);
  }
}
