import { Connector } from "@runmorph/cdk";

const connector = new Connector({
  id: "aircall",
  name: "Aircall",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://dashboard.aircall.io/oauth/authorize",
    accessTokenUrl: "https://api.aircall.io/v1/oauth/token",
    defaultScopes: ["public_api"],
  },
  proxy: {
    baseUrl: "https://api.aircall.io",
  },
});

export type AircallConnector = typeof connector;

export default connector;
