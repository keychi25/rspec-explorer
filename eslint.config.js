const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/out/**",
      "**/dist/**",
      "**/.pnpm-store/**",
      "**/coverage/**",
      "sample/**",
    ],
  },
  js.configs.recommended,
  // Apply TypeScript rules only to TS files (avoid linting this config as TS).
  ...tseslint.configs.recommended.map((c) => ({
    ...c,
    files: ["**/*.ts", "**/*.tsx"],
  })),
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "commonjs",
      },
    },
    rules: {
      // Keep it practical for extension development.
      "no-console": "off",
    },
  },
  // ESLint config file itself runs in Node (CommonJS).
  {
    files: ["eslint.config.js"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Keep ESLint formatting rules out of the way if you use Prettier.
  require("eslint-config-prettier"),
];

