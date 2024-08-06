import { Connector } from "../../../core/src/types";

const connector: Connector = {
  id: "hubspot",
  name: "HubSpot",
  description: "HubSpot connector",
  authorization: {
    type: "oauth2",
    authorizeUrl: "https://app.hubspot.com/oauth/authorize",
    accessTokenUrl: "https://api.hubapi.com/oauth/v1/token",
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
