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
      required: true,
      description:
        "The package ID that need to be installed to support the widgetCardView model.",
    },
    _cardViewPackageSecret: {
      name: "Card View Salesforce Package Secret",
      type: "text",
      required: true,
      description: "The package secret used to secured the request.",
    },
  },
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: async ({ connection }) => {
      const env = await connection.getSetting("env");
      console.log("Salesforce Env", env);
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
      console.log("instanceUrl", instanceUrl);
      return `${instanceUrl}/services/data/v59.0`;
    },
  },
});

export type SalesforceConnector = typeof connector;

export default connector;
