import { Connector } from "@runmorph/cdk";

const connector = new Connector<"hubspot">({
  id: "hubspot",
  name: "HubSpot",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://app.hubspot.com/oauth/authorize",
    accessTokenUrl: "https://api.hubapi.com/oauth/v1/token",
  },
  proxy: {
    baseUrl: "https://api.hubapi.com",
  },
});

export default connector;
