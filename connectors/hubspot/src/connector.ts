import { Connector } from "@runmorph/cdk";

export default new Connector({
  id: "hubspot",
  name: "Hubspot",
  auth: {
    type: "oauth2",
    authorizeUrl: "https://app.hubspot.com/oauth/authorize",
    accessTokenUrl: "https://api.hubapi.com/oauth/v1/token",
  },
  proxy: {
    baseUrl: "https://api.hubapi.com",
  },
});
