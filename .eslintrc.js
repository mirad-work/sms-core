module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
    ecmaVersion: 2020,
  },
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
  ],
  root: true,
  env: {
    node: true,
    jest: true,
    es2020: true,
  },
  ignorePatterns: [
    ".eslintrc.js",
    "dist/**/*",
    "node_modules/**/*",
    "coverage/**/*",
    "*.js",
    "*.d.ts",
  ],
  rules: {
    // TypeScript specific rules
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/prefer-const": "error",
    "@typescript-eslint/no-inferrable-types": "error",
    "@typescript-eslint/ban-ts-comment": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/switch-exhaustiveness-check": "error",

    // Code quality rules
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "warn",
    "no-debugger": "error",
    "no-alert": "error",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",
    "no-sequences": "error",
    "no-throw-literal": "error",
    "no-unneeded-ternary": "error",
    "no-useless-call": "error",
    "no-useless-concat": "error",
    "no-useless-return": "error",
    "prefer-template": "error",
    "prefer-spread": "error",
    "prefer-rest-params": "error",
    
    // Security rules
    "no-new-require": "error",
    "no-path-concat": "error",

    // Style rules for consistency
    "comma-dangle": ["error", "always-multiline"],
    "quotes": ["error", "double"],
    "semi": ["error", "always"],
    "indent": ["error", 2],
    "max-len": ["error", { "code": 100, "ignoreUrls": true }],
    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "never"],

    // Documentation rules
    "spaced-comment": ["error", "always"],
  },
  overrides: [
    {
      // Test files can be more lenient
      files: ["**/*.test.ts", "**/*.spec.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "no-console": "off",
      },
    },
    {
      // Example files can use console
      files: ["examples/**/*.ts"],
      rules: {
        "no-console": "off",
      },
    },
  ],
};
