import { Connector } from "@runmorph/cdk";

const connector = new Connector({
  id: "chargebee",
  name: "Chargebee",
  auth: {
    type: "custom",
    settings: {
      site: {
        type: "text",
        name: "Site",
        description:
          "Your Chargebee site name (e.g. 'your-site' from 'your-site.chargebee.com')",
        required: true,
      },
      _apiKey: {
        type: "text",
        description:
          "Your Chargebee Full Access (All) API key. You can find it in the Chargebee control panel under Settings > API keys.",
        name: "API Key",
        required: true,
      },
    },
  },
  proxy: {
    baseUrl: async ({ connection }) => {
      const site = await connection.getSetting("site");
      const apiKey = await connection.getSetting("_apiKey");

      return `https://${apiKey}@${site}.chargebee.com/api`;
    },
  },
});

export type ChargebeeConnector = typeof connector;

export default connector;
