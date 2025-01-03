import { List } from "@runmorph/cdk";

import HubSpotContactMapper, { type HubSpotContact } from "./mapper";

interface HubSpotContactListResponse {
  results: HubSpotContact[];
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
  scopes: ["crm.objects.contacts.read"],
  mapper: HubSpotContactMapper,
  handler: async (connection, { limit, cursor, fields, filters }) => {
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

    const { data, error } = await connection.proxy<HubSpotContactListResponse>({
      method: "POST",
      path: "/crm/v3/objects/contacts/search",
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
