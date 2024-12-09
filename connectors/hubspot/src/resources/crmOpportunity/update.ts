import { Update } from "@runmorph/cdk";

import HubSpotOpportunityMapper, { type HubSpotDeal } from "./mapper";

export default new Update({
  scopes: ["crm.objects.deals.write"],
  mapper: HubSpotOpportunityMapper,
  handler: async (connection, { id, data }) => {
    // Update the deal in HubSpot API
    const { data: response, error } = await connection.proxy<HubSpotDeal>({
      method: "PATCH",
      path: `/crm/v3/objects/deals/${id}`,
      data,
    });

    if (error) {
      return { error };
    }

    return response;
  },
});
