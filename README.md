# Mirad SMS Core

Framework-agnostic TypeScript OTP/template SMS submission for Kavenegar, SMS.ir, Melipayamak,
IPPanel, and a test-only mock driver.

## Install and quick start

```bash
npm install @mirad-work/sms-core
```

```typescript
import { SmsConfigManager, SmsService } from "@mirad-work/sms-core";

const sms = new SmsService(
  SmsConfigManager.createKavenegarConfig({
    apiKey: process.env.SMS_KAVENEGAR_API_KEY!,
  }),
);

const result = await sms.verify({
  to: "09360000000",
  template: "otp-template",
  tokens: { token: "12345" },
});
```

Node.js 18 or newer is required. `success: true` means the provider accepted the submission. It does
not prove handset delivery; delivery receipts are outside the current contract.

## Providers

| Driver      | Template API                 | Required configuration        | Token mapping                                                           |
| ----------- | ---------------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| Kavenegar   | `verify/lookup.json`         | `url`, `apiKey`               | `token`, `token2`, `token3`, `token10`, `token20`, or positional values |
| SMS.ir      | `send/verify`                | `url`, `apiKey`               | Named parameters; arrays become `Parameter1`, etc.                      |
| Melipayamak | `BaseServiceNumber`          | `url`, `username`, `password` | Semicolon-separated template arguments                                  |
| IPPanel     | legacy API2 pattern endpoint | `url`, `apiKey`, `lineNumber` | Named pattern variables; arrays become `name`, `var2`, etc.             |
| Mock        | no network request           | none                          | Unit and integration testing                                            |

Kavenegar and SMS.ir verification requests do not need a sender line. IPPanel does. The IPPanel
driver intentionally retains the existing API2 contract; IPPanel Edge requires a separate migration
because its URL, authentication, payload, and response differ.

## Safe multi-driver fallback

Fallback is disabled by default. Enable it explicitly:

```typescript
import { DriverType, SmsService } from "@mirad-work/sms-core";

const sms = new SmsService({
  defaultDriver: DriverType.KAVENEGAR,
  timeout: 10_000,
  fallback: {
    enabled: true,
    order: [DriverType.SMSIR, DriverType.MELIPAYAMAK, DriverType.IPPANEL],
  },
  drivers: {
    kavenegar: { url: "https://api.kavenegar.com/v1/", apiKey: "..." },
    smsir: { url: "https://api.sms.ir/v1/", apiKey: "..." },
    melipayamak: {
      url: "https://rest.payamak-panel.com/api/SendSMS/",
      username: "...",
      password: "...",
    },
    ippanel: {
      url: "https://api2.ippanel.com/",
      apiKey: "...",
      lineNumber: "+9830000000",
    },
  },
});
```

The explicit message driver is first; otherwise the default is first. Names are de-duplicated.
Missing/invalid configurations are recorded as `skipped`. A confirmed provider or HTTP rejection may
advance to the next driver. A timeout, network loss, or unexpected post-dispatch failure produces an
`unknown` result and stops immediately because another submission could duplicate the SMS. A
confirmed invalid recipient is terminal too. When every candidate rejects or is skipped, the result
uses `ALL_DRIVERS_FAILED`.

Fallback responses include `requestId`, final `driver`, `submissionStatus`, and sanitized
`attempts`. Attempt records contain no recipient, content, tokens, credentials, or raw provider
response.

### Provider-specific templates

```typescript
await sms.verify({
  to: "09360000000",
  template: "otp-default",
  tokens: { token: "12345" },
  providerOverrides: {
    [DriverType.KAVENEGAR]: {
      template: "otp-payehsho",
      tokens: { token: "12345" },
    },
    [DriverType.MELIPAYAMAK]: {
      template: "496378",
      tokens: { one: "12345" },
    },
  },
});
```

Set `fallback` on one message to override the service default.

### Database-driven policy and audit

Core stays stateless. Integrate your own database with hooks:

```typescript
fallback: {
  enabled: true,
  order: [DriverType.SMSIR],
  resolver: async context => policyRepository.orderFor(context.availableDrivers),
  observer: async attempt => attemptRepository.insert(attempt),
}
```

Resolver failure uses the static order. Observer failure never alters submission behavior. Hooks
receive no message or credential data.

## Environment configuration

```env
SMS_DEFAULT_DRIVER=kavenegar
SMS_TIMEOUT=10000
SMS_FALLBACK_ENABLED=true
SMS_FALLBACK_ORDER=smsir,melipayamak,ippanel

SMS_KAVENEGAR_URL=https://api.kavenegar.com/v1/
SMS_KAVENEGAR_API_KEY=...
SMS_SMSIR_URL=https://api.sms.ir/v1/
SMS_SMSIR_API_KEY=...
SMS_MELIPAYAMAK_URL=https://rest.payamak-panel.com/api/SendSMS/
SMS_MELIPAYAMAK_USERNAME=...
SMS_MELIPAYAMAK_PASSWORD=...
SMS_IPPANEL_URL=https://api2.ippanel.com/
SMS_IPPANEL_API_KEY=...
SMS_IPPANEL_LINE_NUMBER=...
```

Activation requires the exact value `true`. Unknown order entries are ignored; duplicates are
removed.

## Testing and contract

```typescript
const ok = new SmsService(SmsConfigManager.createForTesting());
const rejected = new SmsService(SmsConfigManager.createForTesting({ failureMode: "rejected" }));
const ambiguous = new SmsService(SmsConfigManager.createForTesting({ failureMode: "timeout" }));
```

Mock failure modes are `rejected`, `timeout`, `network`, and `unexpected`. Every driver implements
the single `ISmsDriver.verify` contract. `ISmsResponse.submissionStatus` is `accepted`, `rejected`,
or `unknown`. `SmsDriverFactory` accepts an optional `IHttpClient` for deterministic protocol tests.

```bash
npm test
npm run typecheck
npm run lint:check
npm run build
```

Real-provider checks must be opt-in and take credentials from environment variables. Never commit
keys, passwords, recipients, or production OTPs. Treat `SUBMISSION_OUTCOME_UNKNOWN` as a
reconciliation case; do not immediately resubmit the same OTP. Raw Kavenegar URLs must not be logged
because the API key is part of the URL.

## License

MIT. See [LICENSE](LICENSE).
