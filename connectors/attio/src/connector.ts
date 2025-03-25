import { Connector } from "@runmorph/cdk";

const connector = new Connector({
  id: "attio",
  name: "Attio",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://app.attio.com/authorize",
    accessTokenUrl: "https://app.attio.com/oauth/token",
  },
  proxy: {
    baseUrl: "https://api.attio.com",
  },
});

export type AttioConnector = typeof connector;

export default connector;
