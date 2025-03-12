import { Connector } from "@runmorph/cdk";

type GongTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
  scope: string;
  api_base_url_for_customer: string;
};

const connector = new Connector({
  id: "gong",
  name: "Gong",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://app.gong.io/oauth2/authorize",
    accessTokenUrl: async ({ connector }) => {
      const clientId = await connector.getSetting("clientId");
      const clientSecret = await connector.getSetting("clientSecret");

      const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      );
      console.log({
        url: "https://app.gong.io/oauth2/generate-customer-token",
        headers: {
          Authorization: `Basic ${basicToken}`,
        },
      });
      return {
        url: "https://app.gong.io/oauth2/generate-customer-token",
        headers: {
          Authorization: `Basic ${basicToken}`,
        },
      };
    },
    metadataKeys: ["apiBaseUrl"],
    callbacks: {
      onTokenExchanged: async ({ connection, rawTokens }) => {
        const apiBaseUrl = (rawTokens as GongTokens).api_base_url_for_customer;
        await connection.setMetadata("apiBaseUrl", apiBaseUrl);
      },
    },
  },
  proxy: {
    baseUrl: async ({ connection }) => {
      const apiBaseUrl = await connection.getMetadata("apiBaseUrl");
      return apiBaseUrl!;
    },
  },
});

export type GongConnector = typeof connector;

export default connector;
