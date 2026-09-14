import {
  HttpException,
  IHttpClient,
  IppanelDriver,
  KavenegarDriver,
  MelipayamakDriver,
  SmsIrDriver,
  SmsTransportException,
} from "../src";

const response = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: status === 200 ? "OK" : "Error",
  headers: {},
});

const client = (): jest.Mocked<IHttpClient> =>
  ({
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }) as jest.Mocked<IHttpClient>;

const message = {
  to: "09123456789",
  template: "template-id",
  tokens: { token: "12345" },
};

describe("provider protocol contracts", () => {
  it("maps Kavenegar lookup URL, token and accepted response", async () => {
    const http = client();
    http.get.mockResolvedValue(
      response({
        return: { status: 200, message: "تایید شد" },
        entries: [{ messageid: 1453807 }],
      }),
    );
    const provider = new KavenegarDriver(
      { url: "https://api.kavenegar.com/v1/", apiKey: "secret" },
      http,
    );

    const result = await provider.verify(message);

    expect(result).toMatchObject({
      success: true,
      submissionStatus: "accepted",
      messageId: "1453807",
    });
    const url = http.get.mock.calls[0][0];
    expect(url).toContain("/secret/verify/lookup.json?");
    expect(url).toContain("receptor=09123456789");
    expect(url).toContain("template=template-id");
    expect(url).toContain("token=12345");
  });

  it("maps SMS.ir verify payload and API-key header", async () => {
    const http = client();
    http.post.mockResolvedValue(
      response({ status: 1, message: "success", data: { messageId: "22" } }),
    );
    const provider = new SmsIrDriver(
      { url: "https://api.sms.ir/v1/", apiKey: "secret" },
      http,
    );

    const result = await provider.verify(message);

    expect(result.messageId).toBe("22");
    expect(http.post).toHaveBeenCalledWith(
      "https://api.sms.ir/v1/send/verify",
      {
        mobile: "09123456789",
        templateId: "template-id",
        parameters: [{ name: "token", value: "12345" }],
      },
      expect.objectContaining({
        headers: expect.objectContaining({ "X-API-KEY": "secret" }),
      }),
    );
  });

  it("maps Melipayamak BaseServiceNumber form data and message ID", async () => {
    const http = client();
    http.request.mockResolvedValue(
      response({ Value: "1234567890123456", RetStatus: 1, StrRetStatus: "Ok" }),
    );
    const provider = new MelipayamakDriver(
      {
        url: "https://rest.payamak-panel.com/api/SendSMS/",
        username: "user",
        password: "pass",
      },
      http,
    );

    const result = await provider.verify({
      ...message,
      template: "496378",
      tokens: { one: "12345" },
    });

    expect(result.messageId).toBe("1234567890123456");
    const request = http.request.mock.calls[0][0];
    expect(request.url).toBe(
      "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber",
    );
    expect(request.data).toBeInstanceOf(URLSearchParams);
    expect((request.data as URLSearchParams).toString()).toBe(
      "username=user&password=pass&text=12345&to=09123456789&bodyId=496378",
    );
  });

  it("classifies Melipayamak invalid mobile as terminal recipient failure", async () => {
    const http = client();
    http.request.mockResolvedValue(
      response({ Value: "-18", RetStatus: 0, StrRetStatus: "Error" }),
    );
    const provider = new MelipayamakDriver(
      { url: "https://example.test/", username: "user", password: "pass" },
      http,
    );

    await expect(provider.verify(message)).resolves.toMatchObject({
      success: false,
      failureKind: "recipient",
      submissionStatus: "rejected",
    });
  });

  it("maps IPPanel legacy pattern payload and API-key header", async () => {
    const http = client();
    http.post.mockResolvedValue(
      response({ status: "OK", code: 200, data: { messageId: "33" } }),
    );
    const provider = new IppanelDriver(
      {
        url: "https://api2.ippanel.com/",
        apiKey: "secret",
        lineNumber: "+983000505",
      },
      http,
    );

    const result = await provider.verify(message);

    expect(result.messageId).toBe("33");
    expect(http.post).toHaveBeenCalledWith(
      "https://api2.ippanel.com/api/v1/sms/pattern/normal/send",
      {
        code: "template-id",
        sender: "+983000505",
        recipient: "09123456789",
        variable: { token: "12345" },
      },
      expect.objectContaining({
        headers: expect.objectContaining({ apikey: "secret" }),
      }),
    );
  });

  it("treats an HTTP response as a confirmed rejection", async () => {
    const http = client();
    http.post.mockRejectedValue(
      new HttpException("HTTP 503", 503, { code: 503 }),
    );
    const provider = new SmsIrDriver(
      { url: "https://api.sms.ir/v1/", apiKey: "secret" },
      http,
    );

    await expect(provider.verify(message)).resolves.toMatchObject({
      success: false,
      submissionStatus: "rejected",
      failureKind: "http",
      errorCode: "HTTP_503",
    });
  });

  it.each(["timeout", "network"] as const)(
    "preserves ambiguous %s transport classification",
    async (kind) => {
      const http = client();
      http.post.mockRejectedValue(
        new SmsTransportException("safe error", kind),
      );
      const provider = new SmsIrDriver(
        { url: "https://api.sms.ir/v1/", apiKey: "secret" },
        http,
      );

      await expect(provider.verify(message)).resolves.toMatchObject({
        success: false,
        submissionStatus: "unknown",
        failureKind: kind,
      });
    },
  );
});
