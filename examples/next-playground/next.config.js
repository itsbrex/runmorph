const path = require("path");
const fs = require("fs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  transpilePackages: [
    "@runmorph/framework-next",
    "@runmorph/core",
    "@runmorph/cdk",
    "@runmorph/connector-hubspot",
    "@runmorph/resource-models",
    "@runmorph/adapter-local",
    "@runmorph/adapter-memory",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
      };
    }

    // Always use monorepo paths if they exist
    const isMonorepo = fs.existsSync(path.resolve(__dirname, "../../cdk"));

    if (isMonorepo) {
      // Add console.log for debugging
      console.log("Using monorepo paths for dependencies");

      config.resolve.alias = {
        ...config.resolve.alias,
        "@runmorph/cdk": path.resolve(__dirname, "../../cdk/dist"),
        "@runmorph/core": path.resolve(__dirname, "../../core/dist"),
        "@runmorph/resource-models": path.resolve(
          __dirname,
          "../../resource-models/dist"
        ),
        "@runmorph/connector-hubspot": path.resolve(
          __dirname,
          "../../connectors/hubspot/dist"
        ),
      };
    } else {
      console.log("Using npm packages");
    }

    return config;
  },
};

module.exports = nextConfig;
