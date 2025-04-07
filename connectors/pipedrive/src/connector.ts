import { Connector } from "@runmorph/cdk";

const connector = new Connector({
  id: "pipedrive",
  name: "Pipedrive",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://oauth.pipedrive.com/oauth/authorize",
    accessTokenUrl: "https://oauth.pipedrive.com/oauth/token",
  },
  proxy: {
    baseUrl: "https://api.pipedrive.com",
  },
});

export default connector;
