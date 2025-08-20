# Contributing to Mirad SMS Core

Thank you for your interest in contributing to Mirad SMS Core! This document provides guidelines and
information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. Check if the issue has already been reported
2. Use the appropriate issue template
3. Provide detailed information including:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node.js version, OS, etc.)
   - Error messages or logs

### Suggesting Features

We welcome feature suggestions! Please:

1. Check if the feature has already been requested
2. Explain the use case and benefits
3. Consider if it aligns with the project's scope

### Code Contributions

#### Prerequisites

- Node.js 18+
- npm 8+
- Git

#### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/sms-core.git
   cd sms-core
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Workflow

1. Make your changes
2. Run tests:
   ```bash
   npm test
   ```
3. Run linting:
   ```bash
   npm run lint:check
   ```
4. Run type checking:
   ```bash
   npm run typecheck
   ```
5. Commit your changes with a descriptive message
6. Push to your fork
7. Create a pull request

#### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Write meaningful commit messages
- Add tests for new functionality
- Update documentation as needed

#### Commit Message Format

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:

- `feat(drivers): add new SMS provider support`
- `fix(api): resolve timeout issue in HTTP client`
- `docs(readme): update installation instructions`

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Tests pass
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Documentation is updated
- [ ] Code follows project style

### PR Description

Include:

- Description of changes
- Related issue number
- Testing instructions
- Breaking changes (if any)

## 🏗️ Project Structure

```
src/
├── config/          # Configuration management
├── drivers/         # SMS provider implementations
├── exceptions/      # Custom exceptions
├── interfaces/      # TypeScript interfaces
├── services/        # Core services
├── types/           # Type definitions
└── utils/           # Utility functions
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Use Jest as the testing framework
- Write unit tests for all new functionality
- Use descriptive test names
- Mock external dependencies

## 📚 Documentation

### Code Documentation

- Use JSDoc comments for public APIs
- Include examples in documentation
- Keep documentation up to date

### README Updates

- Update README.md for new features
- Add usage examples
- Update installation instructions if needed

## 🚀 Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a release tag
4. Publish to npm

## 📞 Getting Help

- Open an issue for questions
- Join our community discussions
- Check existing documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Mirad SMS Core! 🚀
