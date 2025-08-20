import { SmsService, SmsConfigManager } from "../src/index";

/**
 * Basic SMS Usage Examples
 */

// Example 1: Simple Verify SMS with Kavenegar
async function simpleVerifySms() {
  console.log("=== Example 1: Simple Verify SMS ===");

  const config = SmsConfigManager.createKavenegarConfig({
    apiKey: "your-kavenegar-api-key",
    lineNumber: "your-line-number",
  });

  const smsService = new SmsService(config);

  try {
    const result = await smsService.verify({
      to: "+989123456789",
      template: "otpCode",
      tokens: { code: "12345" },
    });

    if (result.success) {
      console.log("✅ SMS sent successfully!");
      console.log("Message ID:", result.messageId);
    } else {
      console.log("❌ Failed to send SMS:", result.error);
    }
  } catch (error) {
    console.error("Error:", (error as Error).message);
  }
}

// Run all examples
async function runAllExamples() {
  console.log("🚀 Mirad SMS Core Examples\n");

  await simpleVerifySms();
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
