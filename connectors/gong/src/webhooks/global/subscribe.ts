import { SubscribeToGlobalEvent } from "@runmorph/cdk";

import GongGlobalEventMapper from "./mapper";

export default new SubscribeToGlobalEvent({
  globalEventMapper: GongGlobalEventMapper,
  handler: async (connection) => {
    const apiBaseUrl = await connection.getMetadata("apiBaseUrl");

    if (!apiBaseUrl) {
      return {
        error: {
          code: "CONNECTOR::BAD_CONFIGURATION",
          message: "Missing required configuration: apiBaseUrl",
        },
      };
    }

    const subdomain = apiBaseUrl.match(/https:\/\/(.*?)\.api\.gong\.io/)?.[1];

    if (!subdomain) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::SUBSCRIPTION_FAILED",
          message: "Invalid apiBaseUrl format - could not extract subdomain",
        },
      };
    }

    return {
      identifierKey: subdomain,
    };
  },
});
