import { Retrieve } from "@runmorph/cdk";

import HubSpoCompanyMapper, { type HubSpotCompany } from "./mapper";

export default new Retrieve({
  scopes: ["crm.objects.companies.read"],
  mapper: HubSpoCompanyMapper,
  handler: async (connection, { id, fields }) => {
    // Get the contact from HubSpot API
    const { data, error } = await connection.proxy<HubSpotCompany>({
      method: "GET",
      path: `/crm/v3/objects/companies/${id}`,
      query: {
        properties: fields,
      },
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
