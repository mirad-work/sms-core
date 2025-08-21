# Migration Guide: mirad-sms-core → @mirad-work/sms-core

## Overview

The package name has been changed from `mirad-sms-core` to `@mirad-work/sms-core` to align with
Mirad Work Organization's scoped package naming convention. This is a **breaking change** that
requires manual migration for all existing installations.

## What Changed

- **Package Name**: `mirad-sms-core` → `@mirad-work/sms-core`
- **Import Statements**: All import statements need to be updated
- **Package.json Dependencies**: Dependencies need to be updated
- **Installation Commands**: npm install commands need to be updated

## Migration Steps

### 1. Update package.json Dependencies

**Before:**

```json
{
  "dependencies": {
    "mirad-sms-core": "^0.1.6"
  }
}
```

**After:**

```json
{
  "dependencies": {
    "@mirad-work/sms-core": "^0.1.6"
  }
}
```

### 2. Update Import Statements

**Before:**

```typescript
import { SmsService, SmsConfigManager } from "mirad-sms-core";
import { createKavenegarSmsService } from "mirad-sms-core";
import { DriverType } from "mirad-sms-core";
```

**After:**

```typescript
import { SmsService, SmsConfigManager } from "@mirad-work/sms-core";
import { createKavenegarSmsService } from "@mirad-work/sms-core";
import { DriverType } from "@mirad-work/sms-core";
```

### 3. Update Installation Commands

**Before:**

```bash
npm install mirad-sms-core
yarn add mirad-sms-core
pnpm add mirad-sms-core
```

**After:**

```bash
npm install @mirad-work/sms-core
yarn add @mirad-work/sms-core
pnpm add @mirad-work/sms-core
```

### 4. Update CI/CD Pipelines

If you have CI/CD pipelines that install this package, update them:

**Before:**

```yaml
- name: Install dependencies
  run: npm install mirad-sms-core
```

**After:**

```yaml
- name: Install dependencies
  run: npm install @mirad-work/sms-core
```

## Automated Migration Script

You can use this script to automatically update your codebase:

```bash
#!/bin/bash

# Update package.json
sed -i 's/"mirad-sms-core"/"@mirad-work\/sms-core"/g' package.json

# Update TypeScript/JavaScript files
find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/from "mirad-sms-core"/from "@mirad-work\/sms-core"/g'
find . -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" | xargs sed -i 's/require("mirad-sms-core")/require("@mirad-work\/sms-core")/g'

# Update documentation files
find . -name "*.md" | xargs sed -i 's/mirad-sms-core/@mirad-work\/sms-core/g'

echo "Migration completed! Please review the changes and test your application."
```

## Verification Steps

After migration, verify that:

1. **Package Installation**: `npm install` completes without errors
2. **Import Statements**: All imports resolve correctly
3. **TypeScript Compilation**: `npm run build` or `tsc` completes successfully
4. **Tests Pass**: `npm test` runs without import-related errors
5. **Runtime**: Your application starts and functions correctly

## Rollback Plan

If you encounter issues after migration, you can temporarily rollback:

1. Revert the package.json changes
2. Revert the import statement changes
3. Continue using the old package name until issues are resolved

**Note**: The old package will continue to work, but it's recommended to migrate to the new scoped
package name.

## Support

If you encounter any issues during migration:

1. Check the [documentation](https://github.com/mirad-work/sms-core#readme)
2. Search [existing issues](https://github.com/mirad-work/sms-core/issues)
3. Create a [new issue](https://github.com/mirad-work/sms-core/issues/new) with the `migration`
   label

## Timeline

- **Immediate**: New package `@mirad-work/sms-core` is available
- **Ongoing**: Old package `mirad-sms-core` will continue to work
- **Future**: Old package may be deprecated in a future major version

## Breaking Changes Summary

| Change            | Impact | Migration Required |
| ----------------- | ------ | ------------------ |
| Package name      | High   | ✅ Yes             |
| Import statements | High   | ✅ Yes             |
| API functionality | None   | ❌ No              |
| Configuration     | None   | ❌ No              |

---

**Important**: This is a breaking change that affects all existing installations. Please plan your
migration accordingly and test thoroughly in your development environment before deploying to
production.
