import { Retrieve } from "@runmorph/cdk";

import HubSpotOpportunityMapper, { type HubSpotDeal } from "./mapper";

export default new Retrieve({
  scopes: ["crm.objects.deals.read"],
  mapper: HubSpotOpportunityMapper,
  handler: async (connection, { id, fields }) => {
    // Get the contact from HubSpot API

    const associations: string[] = [];
    const properties = fields.filter((field) => {
      const isAssociation = field.startsWith("association::");
      if (isAssociation) {
        associations.push(field.replace("association::", ""));
      }
      return !isAssociation;
    });

    const query: Record<string, string | string[]> = {
      properties,
    };

    if (associations[0]) {
      query.associations = associations;
    }

    const { data, error } = await connection.proxy<HubSpotDeal>({
      method: "GET",
      path: `/crm/v3/objects/deals/${id}`,
      query,
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
