import {
  SmsService,
  SmsConfigManager,
  DriverType,
  MessageValidationException,
  HttpClient,
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

    it("should fall back to the default timeout when SMS_TIMEOUT is not a number", () => {
      process.env.SMS_TIMEOUT = "ten seconds";

      const config = SmsConfigManager.fromEnvironment();

      expect(config.timeout).toBe(10000);

      delete process.env.SMS_TIMEOUT;
    });

    it("should fall back to the default timeout when SMS_TIMEOUT is empty or non-positive", () => {
      process.env.SMS_TIMEOUT = "";
      expect(SmsConfigManager.fromEnvironment().timeout).toBe(10000);

      process.env.SMS_TIMEOUT = "0";
      expect(SmsConfigManager.fromEnvironment().timeout).toBe(10000);

      process.env.SMS_TIMEOUT = "-1";
      expect(SmsConfigManager.fromEnvironment().timeout).toBe(10000);

      delete process.env.SMS_TIMEOUT;
    });

    it("should honour a valid SMS_TIMEOUT", () => {
      process.env.SMS_TIMEOUT = "2500";

      expect(SmsConfigManager.fromEnvironment().timeout).toBe(2500);

      delete process.env.SMS_TIMEOUT;
    });

    it("should fall back to a zero mock delay when SMS_MOCK_DELAY is not a number", () => {
      process.env.SMS_USE_MOCK = "true";
      process.env.SMS_MOCK_DELAY = "soon";

      const config = SmsConfigManager.fromEnvironment();

      expect(config.drivers.mock?.delay).toBe(0);

      delete process.env.SMS_USE_MOCK;
      delete process.env.SMS_MOCK_DELAY;
    });
  });
});

describe("HttpClient", () => {
  it("should reject a non-numeric timeout instead of aborting every request", () => {
    expect(() => new HttpClient(NaN)).toThrow(
      "Timeout must be a positive number",
    );
  });

  it("should reject a non-positive timeout", () => {
    expect(() => new HttpClient(0)).toThrow("Timeout must be a positive number");
    expect(() => new HttpClient(-1)).toThrow(
      "Timeout must be a positive number",
    );
  });

  it("should reject a non-numeric per-request timeout", async () => {
    const client = new HttpClient(10000);

    await expect(
      client.get("https://example.com/", { timeout: NaN }),
    ).rejects.toThrow("Timeout must be a positive number");
  });

  it("should accept a valid timeout", () => {
    expect(() => new HttpClient(5000)).not.toThrow();
  });
});
