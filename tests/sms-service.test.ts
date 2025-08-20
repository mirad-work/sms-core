import {
  SmsService,
  SmsConfigManager,
  DriverType,
  MessageValidationException,
} from "../src/index";

describe("SmsService", () => {
  let smsService: SmsService;

  beforeEach(() => {
    const config = SmsConfigManager.createForTesting();
    smsService = new SmsService(config);
  });

  describe("verify", () => {
    it("should send verification SMS successfully", async () => {
      const result = await smsService.verify({
        to: "+989123456789",
        template: "verification-code",
        tokens: { code: "12345" },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it("should work with array tokens", async () => {
      const result = await smsService.verify({
        to: "+989123456789",
        template: "welcome-user",
        tokens: ["John Doe", "Premium"],
      });

      expect(result.success).toBe(true);
    });

    it("should throw validation error for missing template", async () => {
      await expect(
        smsService.verify({
          to: "+989123456789",
          tokens: { code: "12345" },
        })
      ).rejects.toThrow(MessageValidationException);
    });

    it("should throw validation error for missing tokens", async () => {
      await expect(
        smsService.verify({
          to: "+989123456789",
          template: "verification-code",
        })
      ).rejects.toThrow(MessageValidationException);
    });
  });

  describe("utility methods", () => {
    it("should return available drivers", () => {
      const drivers = smsService.getAvailableDrivers();
      expect(drivers).toContain(DriverType.MOCK);
    });

    it("should check if driver is available", () => {
      expect(smsService.isDriverAvailable(DriverType.MOCK)).toBe(true);
    });

    it("should return default driver", () => {
      const defaultDriver = smsService.getDefaultDriver();
      expect(defaultDriver).toBe(DriverType.MOCK);
    });

    it("should create verification message object", () => {
      const message = smsService.createVerificationMessage(
        "+989123456789",
        "verification-code",
        { code: "12345" }
      );

      expect(message.to).toBe("+989123456789");
      expect(message.template).toBe("verification-code");
      expect(message.tokens).toEqual({ code: "12345" });
    });
  });
});

describe("SmsConfigManager", () => {
  describe("createForTesting", () => {
    it("should create test configuration", () => {
      const config = SmsConfigManager.createForTesting();

      expect(config.defaultDriver).toBe(DriverType.MOCK);
      expect(config.drivers.mock).toBeDefined();
    });

    it("should accept custom options", () => {
      const config = SmsConfigManager.createForTesting({
        shouldFail: true,
        delay: 1000,
      });

      expect(config.drivers.mock?.shouldFail).toBe(true);
      expect(config.drivers.mock?.delay).toBe(1000);
    });
  });

  describe("createKavenegarConfig", () => {
    it("should create Kavenegar configuration", () => {
      const config = SmsConfigManager.createKavenegarConfig({
        apiKey: "test-key",
        lineNumber: "123456",
      });

      expect(config.defaultDriver).toBe(DriverType.KAVENEGAR);
      expect(config.drivers.kavenegar?.apiKey).toBe("test-key");
      expect(config.drivers.kavenegar?.lineNumber).toBe("123456");
    });
  });

  describe("fromEnvironment", () => {
    it("should create configuration from environment variables", () => {
      // Set test environment variables
      process.env.SMS_DEFAULT_DRIVER = "mock";
      process.env.SMS_USE_MOCK = "true";
      process.env.SMS_MOCK_DELAY = "500";

      const config = SmsConfigManager.fromEnvironment();

      expect(config.defaultDriver).toBe(DriverType.MOCK);
      expect(config.drivers.mock?.delay).toBe(500);

      // Clean up
      delete process.env.SMS_DEFAULT_DRIVER;
      delete process.env.SMS_USE_MOCK;
      delete process.env.SMS_MOCK_DELAY;
    });
  });
});
