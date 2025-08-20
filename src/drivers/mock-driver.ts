import { BaseSmsDriver } from "./base-driver";
import { ISmsMessage, ISmsResponse } from "../interfaces/sms-driver.interface";
import { IMockConfig } from "../interfaces/sms-config.interface";
import { IHttpClient } from "../interfaces/http-client.interface";
import { SmsStatus } from "../types/driver-types";

/**
 * Mock SMS driver for testing purposes
 * Simulates SMS operations without making actual API calls
 */
export class MockDriver extends BaseSmsDriver {
  private readonly mockConfig: IMockConfig;
  private readonly sentMessages: Map<
    string,
    {
      message: ISmsMessage;
      messageId: string;
      status: SmsStatus;
      sentAt: Date;
    }
  > = new Map();
  private messageIdCounter = 1;

  constructor(config: IMockConfig, httpClient: IHttpClient) {
    // Mock driver doesn't need a real URL, so we provide a dummy one
    const mockBaseConfig = {
      url: "https://mock-sms-provider.com",
    };
    super(mockBaseConfig, httpClient);
    this.mockConfig = config;
  }

  /**
   * Mock verify SMS implementation
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

    // Simulate network delay
    if (this.mockConfig.delay) {
      await this.delay(this.mockConfig.delay);
    }

    // Simulate failure if configured
    if (this.mockConfig.shouldFail) {
      return this.createErrorResponse(
        "Mock driver configured to fail",
        "MOCK_FAILURE",
      );
    }

    const messageId = this.generateMessageId();
    const status: SmsStatus = "sent";

    // Generate mock content based on template and tokens
    const mockContent = this.processTemplate(message);

    // Store message for later retrieval
    this.sentMessages.set(messageId, {
      message: {
        ...message,
        content: mockContent,
      },
      messageId,
      status,
      sentAt: new Date(),
    });

    this.log("info", "Mock verification SMS sent successfully", {
      messageId,
      to: message.to,
      template: message.template,
    });

    return this.createSuccessResponse(
      {
        provider: "mock",
        timestamp: new Date().toISOString(),
        recipient: message.to,
        template: message.template,
        processedContent: mockContent,
      },
      messageId,
    );
  }

  /**
   * Generate a mock message ID
   */
  private generateMessageId(): string {
    return `mock-${Date.now()}-${this.messageIdCounter++}`;
  }

  /**
   * Process template with tokens to create mock content
   */
  private processTemplate(message: ISmsMessage): string {
    let content = `[Template: ${message.template}]`;

    if (message.tokens) {
      if (Array.isArray(message.tokens)) {
        content += ` Tokens: [${message.tokens.join(", ")}]`;
      } else {
        content += ` Tokens: ${JSON.stringify(message.tokens)}`;
      }
    }

    return content;
  }

  /**
   * Simple delay utility for simulating network latency
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
