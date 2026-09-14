import {
  DriverType,
  ISmsConfig,
  ISmsDriver,
  ISmsMessage,
  ISmsResponse,
  SmsDriverFactory,
  SmsService,
} from "../src";

const message: ISmsMessage = {
  to: "+989123456789",
  template: "base-template",
  tokens: { token: "12345" },
};

class StubFactory {
  readonly calls: DriverType[] = [];

  constructor(
    private readonly drivers: Partial<Record<DriverType, ISmsDriver>>,
  ) {}

  createDriver(driver: DriverType): ISmsDriver {
    this.calls.push(driver);
    const implementation = this.drivers[driver];
    if (!implementation) throw new Error("unavailable");
    return implementation;
  }

  isDriverAvailable(driver: DriverType): boolean {
    return Boolean(this.drivers[driver]);
  }

  getAvailableDrivers(): DriverType[] {
    return Object.keys(this.drivers) as DriverType[];
  }
}

const driver = (
  response: ISmsResponse,
  received?: ISmsMessage[],
): ISmsDriver => ({
  verify: jest.fn(async (value: ISmsMessage) => {
    received?.push(value);
    return response;
  }),
});

const config = (overrides: Partial<ISmsConfig> = {}): ISmsConfig => ({
  defaultDriver: DriverType.KAVENEGAR,
  drivers: { kavenegar: { url: "https://example.test", apiKey: "key" } },
  fallback: {
    enabled: true,
    order: [DriverType.SMSIR, DriverType.MELIPAYAMAK],
  },
  ...overrides,
});

const service = (cfg: ISmsConfig, factory: StubFactory): SmsService =>
  new SmsService(cfg, factory as unknown as SmsDriverFactory);

describe("SmsService fallback policy", () => {
  it("falls through confirmed rejections and returns the accepting driver", async () => {
    const factory = new StubFactory({
      [DriverType.KAVENEGAR]: driver({
        success: false,
        submissionStatus: "rejected",
        failureKind: "provider_rejection",
        error: "rejected",
      }),
      [DriverType.SMSIR]: driver({
        success: true,
        submissionStatus: "accepted",
        messageId: "smsir-1",
      }),
    });

    const result = await service(config(), factory).verify(message);

    expect(result.success).toBe(true);
    expect(result.driver).toBe(DriverType.SMSIR);
    expect(result.attempts?.map((attempt) => attempt.outcome)).toEqual([
      "rejected",
      "accepted",
    ]);
    expect(factory.calls).toEqual([DriverType.KAVENEGAR, DriverType.SMSIR]);
  });

  it.each(["timeout", "network", "unexpected"] as const)(
    "stops on an ambiguous %s result to prevent duplicates",
    async (failureKind) => {
      const factory = new StubFactory({
        [DriverType.KAVENEGAR]: driver({
          success: false,
          submissionStatus: "unknown",
          failureKind,
          error: "ambiguous",
        }),
        [DriverType.SMSIR]: driver({ success: true }),
      });

      const result = await service(config(), factory).verify(message);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("SUBMISSION_OUTCOME_UNKNOWN");
      expect(factory.calls).toEqual([DriverType.KAVENEGAR]);
    },
  );

  it("stops on a provider-confirmed invalid recipient", async () => {
    const factory = new StubFactory({
      [DriverType.KAVENEGAR]: driver({
        success: false,
        submissionStatus: "rejected",
        failureKind: "recipient",
        errorCode: "KAVENEGAR_411",
      }),
      [DriverType.SMSIR]: driver({ success: true }),
    });

    const result = await service(config(), factory).verify(message);

    expect(result.errorCode).toBe("KAVENEGAR_411");
    expect(factory.calls).toEqual([DriverType.KAVENEGAR]);
  });

  it("puts an explicit driver first and de-duplicates the configured order", async () => {
    const factory = new StubFactory({
      [DriverType.KAVENEGAR]: driver({ success: true }),
      [DriverType.SMSIR]: driver({
        success: false,
        submissionStatus: "rejected",
      }),
    });
    const cfg = config({
      fallback: {
        enabled: true,
        order: [DriverType.SMSIR, DriverType.KAVENEGAR, DriverType.SMSIR],
      },
    });

    const result = await service(cfg, factory).verify({
      ...message,
      driver: DriverType.SMSIR,
    });

    expect(result.success).toBe(true);
    expect(factory.calls).toEqual([DriverType.SMSIR, DriverType.KAVENEGAR]);
  });

  it("applies per-provider template and token overrides", async () => {
    const received: ISmsMessage[] = [];
    const factory = new StubFactory({
      [DriverType.KAVENEGAR]: driver({
        success: false,
        submissionStatus: "rejected",
      }),
      [DriverType.SMSIR]: driver({ success: true }, received),
    });

    await service(config(), factory).verify({
      ...message,
      providerOverrides: {
        [DriverType.SMSIR]: {
          template: "496378",
          tokens: { one: "67890" },
          from: "sender",
        },
      },
    });

    expect(received[0]).toMatchObject({
      template: "496378",
      tokens: { one: "67890" },
      from: "sender",
      driver: DriverType.SMSIR,
    });
  });

  it("records unavailable drivers and aggregates total failure", async () => {
    const factory = new StubFactory({
      [DriverType.KAVENEGAR]: driver({
        success: false,
        submissionStatus: "rejected",
        errorCode: "NO_CREDIT",
      }),
    });

    const result = await service(config(), factory).verify(message);

    expect(result.errorCode).toBe("ALL_DRIVERS_FAILED");
    expect(
      result.attempts?.map(({ driver, outcome }) => [driver, outcome]),
    ).toEqual([
      [DriverType.KAVENEGAR, "rejected"],
      [DriverType.SMSIR, "skipped"],
      [DriverType.MELIPAYAMAK, "skipped"],
    ]);
  });

  it("uses resolver order, falls back to static order if it throws, and ignores observer errors", async () => {
    const observed: DriverType[] = [];
    const factory = new StubFactory({
      [DriverType.KAVENEGAR]: driver({
        success: false,
        submissionStatus: "rejected",
      }),
      [DriverType.SMSIR]: driver({ success: true }),
    });
    const cfg = config({
      fallback: {
        enabled: true,
        order: [DriverType.SMSIR],
        resolver: async () => {
          throw new Error("database offline");
        },
        observer: async (attempt) => {
          observed.push(attempt.driver);
          throw new Error("metrics offline");
        },
      },
    });

    const result = await service(cfg, factory).verify(message);

    expect(result.success).toBe(true);
    expect(observed).toEqual([DriverType.KAVENEGAR, DriverType.SMSIR]);
  });

  it("uses a successful resolver before the static order", async () => {
    const factory = new StubFactory({
      [DriverType.KAVENEGAR]: driver({
        success: false,
        submissionStatus: "rejected",
      }),
      [DriverType.IPPANEL]: driver({ success: true, messageId: "ip-1" }),
      [DriverType.SMSIR]: driver({ success: true, messageId: "smsir-1" }),
    });
    const cfg = config({
      fallback: {
        enabled: true,
        order: [DriverType.SMSIR],
        resolver: () => [DriverType.IPPANEL],
      },
    });

    const result = await service(cfg, factory).verify(message);

    expect(result.driver).toBe(DriverType.IPPANEL);
    expect(factory.calls).toEqual([DriverType.KAVENEGAR, DriverType.IPPANEL]);
  });

  it("allows one message to opt in when service fallback is disabled", async () => {
    const factory = new StubFactory({
      [DriverType.KAVENEGAR]: driver({
        success: false,
        submissionStatus: "rejected",
      }),
      [DriverType.SMSIR]: driver({ success: true }),
    });
    const cfg = config({
      fallback: { enabled: false, order: [DriverType.SMSIR] },
    });

    const result = await service(cfg, factory).verify({
      ...message,
      fallback: true,
    });

    expect(result.success).toBe(true);
    expect(result.attempts).toHaveLength(2);
  });

  it("does not expose attempts when fallback is disabled", async () => {
    const factory = new StubFactory({
      [DriverType.KAVENEGAR]: driver({ success: true, messageId: "one" }),
      [DriverType.SMSIR]: driver({ success: true, messageId: "two" }),
    });

    const result = await service(
      config({ fallback: { enabled: false, order: [DriverType.SMSIR] } }),
      factory,
    ).verify(message);

    expect(result.driver).toBe(DriverType.KAVENEGAR);
    expect(result.requestId).toBeDefined();
    expect(result.attempts).toBeUndefined();
    expect(factory.calls).toEqual([DriverType.KAVENEGAR]);
  });
});
