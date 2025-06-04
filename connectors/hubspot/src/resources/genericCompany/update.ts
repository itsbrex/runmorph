import { Update } from "@runmorph/cdk";

import HubSpotCompanyMapper, { type HubSpotCompany } from "./mapper";

export default new Update({
  scopes: ["crm.objects.companies.write"],
  mapper: HubSpotCompanyMapper,
  handler: async (connection, { id, data }) => {
    // Update the company in HubSpot API
    const { data: response, error } = await connection.proxy<HubSpotCompany>({
      method: "PATCH",
      path: `/crm/v3/objects/companies/${id}`,
      data,
    });

    if (error) {
      return { error };
    }

    return response;
  },
});
