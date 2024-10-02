const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

module.exports = {
  extends: [
    ...["@vercel/style-guide/eslint/next"].map(require.resolve),
    "turbo",
    "plugin:@typescript-eslint/recommended",
  ],
  parserOptions: {
    project,
  },
  globals: {
    React: true,
    JSX: true,
  },
  plugins: ["only-warn", "@typescript-eslint"],
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  ignorePatterns: [".*.js", "node_modules/", "dist/"],
  rules: {
    "import/no-default-export": "off",
    "no-unused-vars": "warn",
  },
  overrides: [
    { files: ["*.js?(x)", "*.ts?(x)"] },
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        "no-undef": "off",
        "@typescript-eslint/no-misused-promises": "warn",
      },
    },
  ],
};
