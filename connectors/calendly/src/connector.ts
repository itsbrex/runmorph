import { Connector } from "@runmorph/cdk";

type CalendlyTokens = {
  access_token: string;
  refresh_token: string;
  organization: string;
};

const connector = new Connector({
  id: "calendly",
  name: "Calendly",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://auth.calendly.com/oauth/authorize",
    accessTokenUrl: async ({ connector }) => {
      const clientId = await connector.getSetting("clientId");
      const clientSecret = await connector.getSetting("clientSecret");

      const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
      );
      return {
        url: "https://auth.calendly.com/oauth/token",
        headers: {
          Authorization: `Basic ${basicToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };
    },
    metadataKeys: ["organizationId"],
    callbacks: {
      onTokenExchanged: async ({ connection, rawTokens }) => {
        const tokens = rawTokens as CalendlyTokens;
        const organizationUrl = tokens.organization;
        const organizationId = organizationUrl.split("/").pop() || "";
        await connection.setMetadata("organizationId", organizationId);
      },
    },
  },
  proxy: {
    baseUrl: "https://api.calendly.com",
  },
});

export type CalendlyConnector = typeof connector;

export default connector;
