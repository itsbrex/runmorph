const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

module.exports = {
  extends: [
    "@vercel/style-guide/eslint/node",
    "@vercel/style-guide/eslint/typescript",
  ].map(require.resolve),
  parserOptions: {
    project,
  },
  env: {
    node: true,
    es6: true,
  },
  plugins: ["only-warn", "jest"],
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  overrides: [
    {
      files: ["**/__tests__/**/*"],
      env: {
        jest: true,
      },
      rules: {
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
  ],
  ignorePatterns: [".*.js", "node_modules/", "dist/"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "warn",
    "@typescript-eslint/no-misused-promises": "warn",
  },
};
