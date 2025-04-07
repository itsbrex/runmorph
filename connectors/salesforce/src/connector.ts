import { Connector } from "@runmorph/cdk";

type SalesforceTokens = {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  id: string;
  token_type: "Bearer";
  issued_at: string;
  signature: string;
};

const connector = new Connector({
  id: "salesforce",
  name: "Salesforce",
  settings: {
    cardViewPackageVersionId: {
      name: "Card View Salesforce Package ID",
      type: "text",
      required: false,
      description:
        "The package ID that need to be installed to support the widgetCardView model.",
    },
    cardViewPackageIframeDomains: {
      name: "Authorized iFrame Domains",
      type: "text",
      required: false,
      description:
        "Comma separated domains e.g. https://example.com,https://corp.co",
    },
    _cardViewPackageSecret: {
      name: "Card View Salesforce Package Secret",
      type: "text",
      required: false,
      description: "The package secret used to secured the request.",
    },
  },
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: async ({ connection }) => {
      const env = await connection.getSetting("env");
      return `https://${env === "sandbox" ? "test" : "login"}.salesforce.com/services/oauth2/authorize`;
    },
    accessTokenUrl: async ({ connection }) =>
      `https://${(await connection.getSetting("env")) === "sandbox" ? "test" : "login"}.salesforce.com/services/oauth2/token`,
    defaultScopes: ["api", "refresh_token", "offline_access"],
    settings: {
      env: {
        name: "Environement",
        type: "select",
        required: true,
        options: {
          sandbox: "Sandbox",
          production: "Production",
        },
        default: "production",
        description:
          "Choose between Salesforce production, the default live environment, or sandbox environment used for testing.",
      },
    },
    metadataKeys: ["instanceUrl"],
    callbacks: {
      onTokenExchanged: async ({ connection, rawTokens }) => {
        // Set instace URL
        const instanceUrl = (rawTokens as SalesforceTokens).instance_url;
        await connection.setMetadata("instanceUrl", instanceUrl);
      },
    },
  },
  proxy: {
    baseUrl: async ({ connection }) => {
      const instanceUrl = await connection.getMetadata("instanceUrl");
      return `${instanceUrl}`;
    },
  },
});

export type SalesforceConnector = typeof connector;

export default connector;
