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

interface HubSpotBatchAssociationResponse {
  results: Array<{
    from: { id: string };
    to: Array<{ id: string }>;
  }>;
}

type AssociationType = "contacts" | "companies" | "engagements";
type AssociationTypeMap = {
  contacts: "deal_to_contact";
  companies: "deal_to_company";
  engagements: "deal_to_engagement";
};

interface DealAssociations {
  contacts: {
    results: Array<{ id: string; type: string }>;
  };
  companies: {
    results: Array<{ id: string; type: string }>;
  };
  engagements: {
    results: Array<{ id: string; type: string }>;
  };
}

export default new List({
  scopes: ["crm.objects.deals.read"],
  mapper: HubSpotOpportunityMapper,
  handler: async (connection, { limit, cursor, fields, q, filters }) => {
    // Separate properties and associations from fields
    const associations: AssociationType[] = [];
    const properties = fields.filter((field) => {
      const isAssociation = field.startsWith("association::");
      if (isAssociation) {
        const assocType = field.replace("association::", "") as AssociationType;
        associations.push(assocType);
      }
      return !isAssociation;
    });

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
      properties: properties,
      after: cursor || null,
    };

    if (q) {
      body.query = q.raw;
    }

    if (filters) {
      // 1. Fetch associated deal IDs
      const filterAssociations = filters?.associations;
      const associatedDealIds = new Set<string>();
      if (filterAssociations) {
        await Promise.all(
          Object.entries(filterAssociations).map(
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

    // Only fetch associations if they are requested in fields
    if (associations.length > 0) {
      const dealIds = data.results.map((deal) => deal.id);

      const associationPromises: Promise<any>[] = [];
      const associationMaps = new Map<
        AssociationType,
        Map<string, Array<{ id: string; type: string }>>
      >();

      // Setup association requests based on requested fields
      if (associations.includes("contacts")) {
        associationPromises.push(
          connection
            .proxy<HubSpotBatchAssociationResponse>({
              method: "POST",
              path: "/crm/v3/associations/deal/contact/batch/read",
              data: {
                inputs: dealIds.map((id) => ({ id })),
              },
            })
            .then((res) => {
              if (!res.error) {
                const contactMap = new Map();
                res.data.results.forEach(({ from, to }) => {
                  contactMap.set(
                    from.id,
                    to.map((t) => ({ id: t.id, type: "deal_to_contact" }))
                  );
                });
                associationMaps.set("contacts", contactMap);
              }
            })
        );
      }

      if (associations.includes("companies")) {
        associationPromises.push(
          connection
            .proxy<HubSpotBatchAssociationResponse>({
              method: "POST",
              path: "/crm/v3/associations/deal/company/batch/read",
              data: {
                inputs: dealIds.map((id) => ({ id })),
              },
            })
            .then((res) => {
              if (!res.error) {
                const companyMap = new Map();
                res.data.results.forEach(({ from, to }) => {
                  companyMap.set(
                    from.id,
                    to.map((t) => ({ id: t.id, type: "deal_to_company" }))
                  );
                });
                associationMaps.set("companies", companyMap);
              }
            })
        );
      }

      if (associations.includes("engagements")) {
        associationPromises.push(
          connection
            .proxy<HubSpotBatchAssociationResponse>({
              method: "POST",
              path: "/crm/v3/associations/deal/engagement/batch/read",
              data: {
                inputs: dealIds.map((id) => ({ id })),
              },
            })
            .then((res) => {
              if (!res.error) {
                const engagementMap = new Map();
                res.data.results.forEach(({ from, to }) => {
                  engagementMap.set(
                    from.id,
                    to.map((t) => ({ id: t.id, type: "deal_to_engagement" }))
                  );
                });
                associationMaps.set("engagements", engagementMap);
              }
            })
        );
      }

      // Wait for all association requests to complete
      await Promise.all(associationPromises);

      // Enrich deals with requested associations
      const enrichedDeals = data.results.map((deal) => {
        const enrichedDeal = { ...deal };
        const dealAssociations: DealAssociations = {
          contacts: { results: [] },
          companies: { results: [] },
          engagements: { results: [] },
        };

        associations.forEach((assocType) => {
          const assocMap = associationMaps.get(assocType);
          if (assocMap) {
            dealAssociations[assocType] = {
              results: assocMap.get(deal.id) || [],
            };
          }
        });

        enrichedDeal.associations = dealAssociations;
        return enrichedDeal;
      });

      return {
        data: enrichedDeals,
        next: data.paging?.next?.after || null,
      };
    }

    // Return deals without associations if none were requested
    return {
      data: data.results,
      next: data.paging?.next?.after || null,
    };
  },
});
