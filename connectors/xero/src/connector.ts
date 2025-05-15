import { Connector } from "@runmorph/cdk";

type XeroTenant = {
  id: string;
  tenantId: string;
  tenantType: string;
  tenantName: string;
  authEventId: string;
};

type XeroTokens = {
  access_token: string;
  refresh_token: string;
  authentication_event_id?: string;
};

const connector = new Connector({
  id: "xero",
  name: "Xero",
  auth: {
    type: "oauth2::authorizationCode",
    authorizeUrl: "https://login.xero.com/identity/connect/authorize",
    accessTokenUrl: "https://identity.xero.com/connect/token",
    defaultScopes: ["offline_access"],
    metadataKeys: ["tenantId"],
    callbacks: {
      onTokenExchanged: async ({ connection, rawTokens }) => {
        const authenticationEventId = (rawTokens as XeroTokens)
          .authentication_event_id;

        const { data, error } = await connection.proxy<XeroTenant[]>({
          method: "GET",
          path: "/connections",
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.length === 0) {
          throw new Error("No Xero tenants found");
        }

        let selectedTenant: XeroTenant;

        if (authenticationEventId) {
          const matchingTenants = data.filter(
            (tenant) => tenant.authEventId === authenticationEventId
          );

          selectedTenant =
            matchingTenants.length > 0 ? matchingTenants[0] : data[0];
        } else {
          selectedTenant = data[0];
        }

        await connection.setMetadata("tenantId", selectedTenant.tenantId);
      },
    },
  },
  proxy: {
    baseUrl: async ({ connection }) => {
      const tenantId = await connection.getMetadata("tenantId");

      const baseConfig = {
        url: `https://api.xero.com`,
        headers: {},
      };

      if (tenantId) {
        baseConfig.headers = {
          "xero-tenant-id": tenantId,
        };
      }

      return baseConfig;
    },
  },
});

export type XeroConnector = typeof connector;

export default connector;
