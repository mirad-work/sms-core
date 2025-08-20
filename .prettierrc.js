module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: "all",
  singleQuote: false,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // TypeScript specific
  parser: "typescript",

  // File specific overrides
  overrides: [
    {
      files: "*.{js,jsx}",
      options: {
        parser: "babel",
      },
    },
    {
      files: "*.json",
      options: {
        parser: "json",
        printWidth: 120,
      },
    },
    {
      files: "*.md",
      options: {
        parser: "markdown",
        printWidth: 100,
        proseWrap: "always",
      },
    },
  ],
};
