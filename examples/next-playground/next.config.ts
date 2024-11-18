/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@morphcloud/cdk",
    "@morphcloud/core",
    "@morphcloud/connectors-hubspot",
  ],
};

module.exports = nextConfig;
