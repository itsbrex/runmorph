import { Connector } from "@runmorph/cdk";

const connector = new Connector({
  id: "dialpad",
  name: "Dialpad",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://dialpad.com/oauth2/authorize",
    accessTokenUrl: "https://dialpad.com/oauth2/token",
    defaultScopes: ["recordings_export", "calls:list", "offline_access"],
  },
  proxy: {
    baseUrl: "https://dialpad.com/api",
  },
});

export type DialpadConnector = typeof connector;

export default connector;
