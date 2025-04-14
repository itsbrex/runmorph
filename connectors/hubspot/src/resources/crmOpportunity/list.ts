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

interface HubSpotAssociationResponse {
  results: Array<{
    id: string;
    type: "contact_to_deal" | "company_to_deal";
  }>;
}

export default new List({
  scopes: ["crm.objects.deals.read"],
  mapper: HubSpotOpportunityMapper,
  handler: async (connection, { limit, cursor, fields, q, filters }) => {
    const body: {
      sorts: never[];
      filterGroups: FilterGroups[];
      limit: number;
      properties: string[];
      after: string | null;
      query?: string;
    } = {
      sorts: [],
      filterGroups: [] as FilterGroups[],
      limit: limit,
      properties: fields,
      after: cursor || null,
    };

    if (q) {
      body.query = q.raw;
    }

    if (filters) {
      // 1. Fetch associated deal IDs
      const associations = filters?.associations;
      const associatedDealIds = new Set<string>();
      if (associations) {
        await Promise.all(
          Object.entries(associations).map(
            async ([objectType, association]) => {
              const objectId = association?.results?.[0]?.id;
              if (!objectId) {
                return;
              }
              const associationResult =
                await connection.proxy<HubSpotAssociationResponse>({
                  method: "GET",
                  path: `/crm/v3/objects/${objectType}/${objectId}/associations/deals`,
                });
              if (associationResult.error) {
                return;
              }
              if (associatedDealIds.size === 0) {
                // First association - add all IDs
                associationResult.data.results.forEach((result) => {
                  associatedDealIds.add(result.id);
                });
              } else {
                // Filter to only keep IDs that exist in both sets
                const newDealIds = new Set(
                  associationResult.data.results.map((r) => r.id)
                );
                for (const dealId of associatedDealIds) {
                  if (!newDealIds.has(dealId)) {
                    associatedDealIds.delete(dealId);
                  }
                }
              }
            }
          )
        );
      }

      const propertyFilters = filters.properties;
      const filterGroups: FilterGroups[] = [];

      // 2. If there are associated deal IDs, create filter groups for each
      if (associatedDealIds.size > 0) {
        for (const dealId of associatedDealIds) {
          const filtersForGroup: any[] = [
            { propertyName: "hs_object_id", operator: "EQ", value: dealId },
          ];

          if (propertyFilters) {
            for (const [key, value] of Object.entries(propertyFilters)) {
              filtersForGroup.push({
                propertyName: key,
                operator: "EQ",
                value: value,
              });
            }
          }

          filterGroups.push({ filters: filtersForGroup });
        }
      }

      // 3. If no associated deal IDs, create a filter group with just the property filters
      if (associatedDealIds.size === 0 && propertyFilters) {
        const filtersForGroup: any[] = [];

        for (const [key, value] of Object.entries(propertyFilters)) {
          filtersForGroup.push({
            propertyName: key,
            operator: "EQ",
            value: value,
          });
        }

        filterGroups.push({ filters: filtersForGroup });
      }
      body.filterGroups = filterGroups;
    }

    // 4. Perform the search with the constructed filter groups
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
