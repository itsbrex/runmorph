import { List } from "@runmorph/cdk";

import HubSpotCompanyMapper, { type HubSpotCompany } from "./mapper";

interface HubSpotCompanyListResponse {
  results: HubSpotCompany[];
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
  scopes: ["crm.objects.companies.read"],
  mapper: HubSpotCompanyMapper,
  handler: async (connection, { limit, cursor, fields, q }) => {
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
      // For non-text queries, use filters
      if (q.type === "phone") {
        // Create separate filter groups for each phone format and field
        const phoneFields = ["phone"];
        const phoneFormats = Array.from(
          new Set([q.e164, q.nationalNumber, q.internationalNumber])
        );

        phoneFields.forEach((field) => {
          phoneFormats.forEach((format) => {
            if (format) {
              const phoneFilterGroup: FilterGroups = { filters: [] };
              phoneFilterGroup.filters.push({
                propertyName: field,
                operator: "CONTAINS_TOKEN",
                value: format,
              });
              body.filterGroups.push(phoneFilterGroup);
            }
          });
        });
      } else if (
        q.type === "domain" ||
        q.type === "url" ||
        q.type === "email"
      ) {
        // Use q.domain directly for domain search
        const domainFields = ["domain", "website"];
        domainFields.forEach((field) => {
          const domainFilterGroup: FilterGroups = { filters: [] };
          domainFilterGroup.filters.push({
            propertyName: field,
            operator: "CONTAINS_TOKEN",
            value: q.domain,
          });
          body.filterGroups.push(domainFilterGroup);
        });
      } else {
        body.query = q.raw;
      }
    }

    const { data, error } = await connection.proxy<HubSpotCompanyListResponse>({
      method: "POST",
      path: "/crm/v3/objects/companies/search",
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
