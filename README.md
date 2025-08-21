# Mirad SMS Core

A powerful, framework-agnostic TypeScript SMS service library for Iranian SMS providers. Built with
production-ready standards.

[![npm version](https://badge.fury.io/js/@mirad-work/sms-core.svg)](https://badge.fury.io/js/@mirad-work/sms-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/mirad-work/sms-core.svg?style=social&label=Star)](https://github.com/mirad-work/sms-core)
[![GitHub forks](https://img.shields.io/github/forks/mirad-work/sms-core.svg?style=social&label=Fork)](https://github.com/mirad-work/sms-core/fork)

## ✨ Features

- 🚀 **Framework Agnostic**: Works with any Node.js framework (Express, NestJS, Fastify, etc.)
- 🔧 **TypeScript First**: Full TypeScript support with comprehensive type definitions
- 🏗️ **Modular Architecture**: Clean separation of concerns with driver pattern
- 🌐 **Multiple Providers**: Support for major Iranian SMS providers
- ⚙️ **Configuration Flexibility**: Environment variables, direct config, or factory methods
- 🧪 **Production Ready**: Comprehensive error handling, logging, and testing
- 📱 **OTP/Verification**: Specialized support for verification and OTP messages
- 🔒 **Secure**: Input validation and security best practices
- 📚 **Well Documented**: Extensive documentation and examples

## 📦 Supported Providers

- **Kavenegar** - Full support for verification APIs
- **SMS.ir** - Complete integration with template messaging
- **Melipayamak** - Pattern-based SMS support
- **Mock Driver** - For testing and development

## 🚀 Quick Start

> **⚠️ Breaking Change Notice**: The package name has changed from `mirad-sms-core` to
> `@mirad-work/sms-core`. If you're upgrading from a previous version, please see our
> [Migration Guide](MIGRATION.md) for detailed instructions.

### Installation

```bash
npm install @mirad-work/sms-core
```

### Basic Usage

```typescript
import { SmsService, SmsConfigManager } from "@mirad-work/sms-core";

// Using factory method (recommended)
const smsService = SmsConfigManager.createKavenegarConfig({
  apiKey: "your-kavenegar-api-key",
  lineNumber: "your-line-number",
});

// Send verification SMS
const result = await smsService.verify({
  to: "+989123456789",
  template: "verification-code",
  tokens: { code: "12345" },
});

if (result.success) {
  console.log("SMS sent successfully!", result.messageId);
} else {
  console.error("Failed to send SMS:", result.error);
}
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# SMS Service Configuration
SMS_DEFAULT_DRIVER=kavenegar
SMS_TIMEOUT=10000

# Kavenegar Configuration
SMS_KAVENEGAR_API_KEY=your-kavenegar-api-key
SMS_KAVENEGAR_LINE_NUMBER=your-line-number
SMS_KAVENEGAR_URL=https://api.kavenegar.com/v1/

# SMS.ir Configuration
SMS_SMSIR_API_KEY=your-smsir-api-key
SMS_SMSIR_LINE_NUMBER=your-line-number

# Melipayamak Configuration
SMS_MELIPAYAMAK_API_KEY=your-melipayamak-api-key
SMS_MELIPAYAMAK_LINE_NUMBER=your-line-number
```

### Using Environment Configuration

```typescript
import { SmsService, SmsConfigManager } from "@mirad-work/sms-core";

const config = SmsConfigManager.fromEnvironment();
const smsService = new SmsService(config);
```

### Manual Configuration

```typescript
import { SmsService, DriverType } from "@mirad-work/sms-core";

const smsService = new SmsService({
  defaultDriver: DriverType.KAVENEGAR,
  timeout: 10000,
  drivers: {
    kavenegar: {
      url: "https://api.kavenegar.com/v1/",
      apiKey: "your-api-key",
      lineNumber: "your-line-number",
    },
  },
});
```

## 📱 Usage Examples

### Sending Verification Code

```typescript
// Simple verification code
await smsService.verify({
  to: "+989123456789",
  template: "verify",
  tokens: { code: "123456" },
});

// Multiple tokens
await smsService.verify({
  to: "+989123456789",
  template: "welcome",
  tokens: { name: "John", code: "123456" },
});

// Array tokens (positional)
await smsService.verify({
  to: "+989123456789",
  template: "order-status",
  tokens: ["John Doe", "Delivered", "Order #12345"],
});
```

### Using Specific Drivers

```typescript
// Force specific driver for this message
await smsService.verify({
  to: "+989123456789",
  template: "verify",
  tokens: { code: "123456" },
  driver: DriverType.SMSIR,
});
```

### Error Handling

```typescript
try {
  const result = await smsService.verify({
    to: "+989123456789",
    template: "verify",
    tokens: { code: "123456" },
  });

  if (!result.success) {
    console.error("SMS failed:", result.error);
    console.error("Error code:", result.errorCode);
  }
} catch (error) {
  if (error instanceof MessageValidationException) {
    console.error("Invalid message:", error.message);
  } else if (error instanceof SmsDriverException) {
    console.error("Driver error:", error.message);
  }
}
```

## 🏗️ Framework Integration

### Express.js

```typescript
import express from "express";
import { createKavenegarSmsService } from "@mirad-work/sms-core";

const app = express();
const smsService = createKavenegarSmsService({
  apiKey: process.env.KAVENEGAR_API_KEY!,
  lineNumber: process.env.KAVENEGAR_LINE_NUMBER!,
});

app.post("/send-otp", async (req, res) => {
  try {
    const result = await smsService.verify({
      to: req.body.phone,
      template: "otp",
      tokens: { code: generateOTP() },
    });

    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### NestJS

```typescript
import { Injectable } from "@nestjs/common";
import { SmsService, SmsConfigManager } from "@mirad-work/sms-core";

@Injectable()
export class NotificationService {
  private smsService: SmsService;

  constructor() {
    this.smsService = new SmsService(SmsConfigManager.fromEnvironment());
  }

  async sendVerificationCode(phone: string, code: string) {
    return await this.smsService.verify({
      to: phone,
      template: "verification",
      tokens: { code },
    });
  }
}
```

## 🧪 Testing

### Using Mock Driver

```typescript
import { createMockSmsService } from "@mirad-work/sms-core";

// For testing - always succeeds
const mockService = createMockSmsService();

// For testing failures
const failingMockService = createMockSmsService({
  shouldFail: true,
});

// Simulate network delay
const slowMockService = createMockSmsService({
  delay: 1000,
});
```

### Jest Testing Example

```typescript
import { SmsService, SmsConfigManager } from "@mirad-work/sms-core";

describe("SMS Service", () => {
  let smsService: SmsService;

  beforeEach(() => {
    smsService = new SmsService(SmsConfigManager.createForTesting());
  });

  it("should send verification SMS", async () => {
    const result = await smsService.verify({
      to: "+989123456789",
      template: "verify",
      tokens: { code: "123456" },
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
```

## 🔒 Security Considerations

- Always validate phone numbers before sending
- Use environment variables for sensitive configuration
- Implement rate limiting in your application
- Log SMS operations for audit trails
- Use HTTPS for all API communications

## 📊 Monitoring and Logging

The library includes built-in logging for debugging:

```typescript
// Enable debug logging
process.env.NODE_ENV = "development";

// Logs will appear in console for:
// - SMS send attempts
// - API responses
// - Error conditions
```

## 🔧 Advanced Configuration

### Custom HTTP Client

```typescript
import { SmsService, HttpClient } from "@mirad-work/sms-core";

const customHttpClient = new HttpClient(15000); // 15 second timeout
const smsService = new SmsService(config, undefined, customHttpClient);
```

### Multiple Driver Support

```typescript
const config = {
  defaultDriver: DriverType.KAVENEGAR,
  drivers: {
    kavenegar: {
      url: "https://api.kavenegar.com/v1/",
      apiKey: "kavenegar-key",
      lineNumber: "kavenegar-line",
    },
    smsir: {
      url: "https://api.sms.ir/v1/",
      apiKey: "smsir-key",
      lineNumber: "smsir-line",
    },
  },
};

// Use different providers for different purposes
await smsService.verify({
  to: "+989123456789",
  template: "otp",
  tokens: { code: "123456" },
  driver: DriverType.SMSIR, // Override default
});
```

## 📚 API Documentation

### Classes

- `SmsService` - Main service class
- `SmsConfigManager` - Configuration management
- `HttpClient` - HTTP client implementation
- Various driver classes and exceptions

### Interfaces

- `ISmsMessage` - SMS message structure
- `ISmsResponse` - SMS response structure
- `ISmsConfig` - Configuration interface

### Types

- `DriverType` - Supported driver types
- `SmsStatus` - Message status types

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

- 📖 [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project
- 📋 [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines
- 📝 [Issue Templates](.github/ISSUE_TEMPLATE/) - Templates for bug reports and feature requests

### Development Setup

```bash
# Clone the repository
git clone https://github.com/mirad-work/sms-core.git
cd sms-core

# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build the project
npm run build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues and Support

If you encounter any issues or need support:

1. Check the [documentation](https://github.com/mirad-work/sms-core#readme)
2. Search [existing issues](https://github.com/mirad-work/sms-core/issues)
3. Create a [new issue](https://github.com/mirad-work/sms-core/issues/new)

## 📈 Roadmap

- [ ] Additional SMS provider support
- [ ] Message queuing capabilities
- [ ] Advanced retry mechanisms
- [ ] Webhooks and delivery status
- [ ] Message templates management
- [ ] Bulk SMS operations

## 🙏 Acknowledgments

- Iranian SMS providers for their API documentation
- TypeScript community for excellent tooling
- All contributors who help improve this library

### Connect With Us

- 🌐 [Website](https://mirad.work) - Learn more about Mirad Work Organization
- 📧 [Open Source Team](mailto:opensource@mirad-work.work) - Questions about our open source
  projects

---

Made with ❤️ by [Mirad Work Organization](https://mirad.work) for the Iranian developer community
