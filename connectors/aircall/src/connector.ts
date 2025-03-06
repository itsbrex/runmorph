import { Connector } from "@runmorph/cdk";

const connector = new Connector({
  id: "aircall",
  name: "Aircall",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://dashboard.aircall.io/oauth/authorize",
    accessTokenUrl: "https://api.aircall.io/v1/oauth/token",
    settings: {
      apiId: {
        name: "API ID",
        type: "text",
        required: true,
        description: "Find it in Aircall Dashboard > Integrations > API Key",
      },
      apiToken: {
        name: "API Token",
        type: "text",
        required: true,
        description: "Find it in Aircall Dashboard > Integrations > API Key",
      },
    },
  },
  proxy: {
    baseUrl: async ({ connection }) => {
      const apiId = await connection.getSetting("apiId");
      const apiToken = await connection.getSetting("apiToken");

      const baseUrl = `https://${apiId}:${apiToken}@api.aircall.io`;
      console.log({ apiId, apiToken, baseUrl });
      return baseUrl;
    },
  },
});

export type AircallConnector = typeof connector;

export default connector;
