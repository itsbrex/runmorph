import { Create } from "@runmorph/cdk";

import HubSpotOpportunityMapper, { type HubSpotDeal } from "./mapper";

export default new Create({
  scopes: ["crm.objects.deals.write"],
  mapper: HubSpotOpportunityMapper,
  handler: async (connection, { data }) => {
    // Create a new deal in HubSpot API
    const { data: response, error } = await connection.proxy<HubSpotDeal>({
      method: "POST",
      path: "/crm/v3/objects/deals",
      data,
    });

    if (error) {
      return { error };
    }

    return response;
  },
});
