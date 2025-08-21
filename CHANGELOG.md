# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-01-27

### Changed

- **BREAKING CHANGE**: Package name changed from `mirad-sms-core` to `@mirad-work/sms-core` to align
  with Mirad Work Organization's scoped package naming convention
  - Update your imports from `import { ... } from "mirad-sms-core"` to
    `import { ... } from "@mirad-work/sms-core"`
  - Update your package.json dependencies from `"mirad-sms-core"` to `"@mirad-work/sms-core"`
  - This change affects all existing installations and requires manual migration
  - See [Migration Guide](MIGRATION.md) for detailed instructions

## [Unreleased]

### Added

- Initial release of Mirad SMS Core
- Support for Kavenegar SMS provider
- Support for SMS.ir provider
- Support for Melipayamak provider
- Mock driver for testing
- TypeScript-first architecture
- Comprehensive error handling
- Environment-based configuration
- HTTP client abstraction
- Verification SMS support
- Template-based messaging
- Production-ready logging
- Comprehensive test suite

### Features

- Framework-agnostic design
- Multiple SMS provider support
- Flexible configuration options
- Type-safe API
- Comprehensive documentation
- MIT License

## [0.1.1] - 2025-08-20

### Added

- Initial public release
- Core SMS service functionality
- Driver pattern implementation
- Configuration management
- Error handling and exceptions
- HTTP client utilities
- TypeScript interfaces and types
- Comprehensive documentation
- Example usage and integration guides
- Testing framework and examples

### Supported Providers

- Kavenegar (verification APIs)
- SMS.ir (template messaging)
- Melipayamak (pattern-based SMS)
- Mock driver (testing)

### Technical Features

- Node.js 18+ support
- TypeScript 5.9+ support
- Jest testing framework
- ESLint and Prettier configuration
- Husky pre-commit hooks
- GitHub Actions CI/CD
- NPM package publishing setup

---

## Version History

- **0.2.0** - Package name change to scoped package (@mirad-work/sms-core) - **BREAKING CHANGE**
- **0.1.1** - Initial release with core functionality and multiple provider support

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for
submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
