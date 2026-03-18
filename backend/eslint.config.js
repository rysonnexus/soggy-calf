const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    files: ["src/**/*.js", "prisma/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["node_modules/**", "dist/**"],
  },
];
