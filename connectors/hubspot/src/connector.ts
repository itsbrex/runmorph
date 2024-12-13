import { Connector } from "@runmorph/cdk";

const connector = new Connector({
  id: "hubspot",
  name: "HubSpot",
  settings: {
    hapikey: {
      name: "Developer API Key",
      type: "text",
      required: true,
      description:
        "Find it in HubSpot developer portal > 'Apps' > top right 'GetHubSpot API Key'",
    },
    appId: {
      name: "App Id",
      type: "text",
      required: true,
      description:
        "The App Id related to your HubSpot OAuth app; find it in HubSpot developer portal > 'Apps' > 'App ID' at the bottom of the app in the list",
    },
  },
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://app.hubspot.com/oauth/authorize",
    accessTokenUrl: "https://api.hubapi.com/oauth/v1/token",
  },
  proxy: {
    baseUrl: "https://api.hubapi.com",
  },
});

export type HubSpotConnector = typeof connector;

export default connector;
