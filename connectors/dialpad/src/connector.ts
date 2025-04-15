import { Connector } from "@runmorph/cdk";

const connector = new Connector({
  id: "dialpad",
  name: "Dialpad",
  settings: {
    env: {
      name: "Environment",
      type: "text",
      required: false,
      description:
        "Set to 'sandbox' to use the sandbox environment, or leave blank to use the production environment.",
    },
  },
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: async ({ connector }) => {
      const env = await connector.getSetting("env");
      return `https://${env === "sandbox" ? "sandbox.dialpad" : "dialpad"}.com/oauth2/authorize`;
    },
    accessTokenUrl: async ({ connector }) =>
      `https://${(await connector.getSetting("env")) === "sandbox" ? "sandbox.dialpad" : "dialpad"}.com/oauth2/token`,

    defaultScopes: ["offline_access"],
  },
  proxy: {
    baseUrl: async ({ connector }) => {
      const env = await connector.getSetting("env");
      return `https://${env === "sandbox" ? "sandbox.dialpad" : "dialpad"}.com/api`;
    },
  },
});

export type DialpadConnector = typeof connector;

export default connector;
