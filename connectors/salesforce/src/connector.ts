import { Connector } from "@runmorph/cdk";

const connector = new Connector<"salesforce">({
  id: "salesforce",
  name: "Salesforce",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://login.salesforce.com/services/oauth2/authorize",
    accessTokenUrl: "https://login.salesforce.com/services/oauth2/token",
    defaultScopes: ["api", "refresh_token", "offline_access"],
  },
  proxy: {
    baseUrl: "${raw_tokens.instance_url}/services/data/v49.0",
  },
});

export default connector;
