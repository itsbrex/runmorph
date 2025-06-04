import { Create } from "@runmorph/cdk";

import HubSpotCompanyMapper, { type HubSpotCompany } from "./mapper";

export default new Create({
  scopes: ["crm.objects.companies.write"],
  mapper: HubSpotCompanyMapper,
  handler: async (connection, { data }) => {
    // Create a new company in HubSpot API
    const { data: response, error } = await connection.proxy<HubSpotCompany>({
      method: "POST",
      path: "/crm/v3/objects/companies",
      data,
    });

    if (error) {
      return { error };
    }

    return response;
  },
});
