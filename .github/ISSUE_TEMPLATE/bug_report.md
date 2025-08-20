---
name: Bug report
about: Create a report to help us improve
title: "[BUG] "
labels: ["bug"]
assignees: ""
---

**Describe the bug** A clear and concise description of what the bug is.

**To Reproduce** Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior** A clear and concise description of what you expected to happen.

**Actual behavior** A clear and concise description of what actually happened.

**Environment:**

- OS: [e.g. Ubuntu 22.04]
- Node.js version: [e.g. 18.17.0]
- NPM version: [e.g. 9.6.7]
- Mirad SMS Core version: [e.g. 1.0.0]

**SMS Provider:**

- Provider: [e.g. Kavenegar, SMS.ir, Melipayamak]
- API Version: [if applicable]

**Code Example**

```typescript
// Please provide a minimal code example that reproduces the issue
import { SmsService } from "mirad-sms-core";

const smsService = new SmsService(config);
// ... your code here
```

**Error Messages**

```
// Please paste any error messages or stack traces here
```

**Additional context** Add any other context about the problem here, such as:

- Configuration details
- Network environment
- Related issues

**Screenshots** If applicable, add screenshots to help explain your problem.

**Checklist**

- [ ] I have searched existing issues to avoid duplicates
- [ ] I have provided all required information
- [ ] I have included a minimal code example
- [ ] I have included error messages/stack traces
