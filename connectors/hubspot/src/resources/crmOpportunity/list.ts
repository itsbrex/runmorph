import { List } from "@runmorph/cdk";

import HubSpotOpportunityMapper, { type HubSpotDeal } from "./mapper";

interface HubSpotDealListResponse {
  results: HubSpotDeal[];
  paging?: {
    next?: {
      after?: string;
    };
  };
}

interface FilterGroups {
  filters: Array<{
    propertyName: string;
    operator: string;
    value: string;
  }>;
}

export default new List({
  scopes: ["crm.objects.deals.read"],
  mapper: HubSpotOpportunityMapper,
  handler: async (connection, { limit, cursor, fields, filters }) => {
    // If no filter – use list to get associations in one request.

    const body = {
      sorts: [],
      filterGroups: [] as FilterGroups[],
      limit: limit,
      properties: fields,
      after: cursor || null,
    };

    if (filters) {
      const filterGroup: FilterGroups = { filters: [] };
      for (const [key, value] of Object.entries(filters)) {
        filterGroup.filters.push({
          propertyName: key,
          operator: "EQ",
          value: value,
        });
      }
      body.filterGroups.push(filterGroup);
    }

    const { data, error } = await connection.proxy<HubSpotDealListResponse>({
      method: "POST",
      path: "/crm/v3/objects/deals/search",
      data: body,
    });

    if (error) {
      return { error };
    }

    return {
      data: data.results,
      next: data.paging?.next?.after || null,
    };
  },
});
