import { Connector } from "../../core/src/types";

const connector: Connector = {
  id: "salesforce",
  name: "Salesforce",
  description: "Salesforce connector",
  authorization: {
    type: "oauth2",
    authorizeUrl: "https://login.salesforce.com/services/oauth2/authorize",
    accessTokenUrl: "https://login.salesforce.com/services/oauth2/token",
    configs: [],
  },
};

export default connector;

/*{
        key: "evironment",
        type: "select",
        required: true,
        description: "HubSpot environment",
        default: "production",
        options: [
          { key: "sandbox", value: "Sandbox" },
          { key: "production", value: "Production" },
        ],
      },*/
