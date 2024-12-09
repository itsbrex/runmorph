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
    config.resolve.alias = {
      ...config.resolve.alias,
      '@runmorph/cdk': require.resolve('@runmorph/cdk')
    }
    return config
  }
};

module.exports = nextConfig;
