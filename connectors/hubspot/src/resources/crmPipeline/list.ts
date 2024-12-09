import { List } from "@runmorph/cdk";

import HubSpotPipelineMapper, { type HubSpotPipeline } from "./mapper";

interface HubSpotPipelineListResponse {
  results: HubSpotPipeline[];
  paging?: {
    next?: {
      after?: string;
    };
  };
}

export default new List({
  scopes: [],
  mapper: HubSpotPipelineMapper,
  handler: async (connection, { limit, cursor, fields }) => {
    const query: Record<string, string | number | null> = {
      limit: limit || 100,
      after: cursor || null,
    };

    if (fields && fields.length > 0) {
      query.properties = fields.join(",");
    }

    const { data, error } = await connection.proxy<HubSpotPipelineListResponse>(
      {
        method: "GET",
        path: "/crm/v3/pipelines/deals",
        query,
      },
    );

    if (error) {
      return { error };
    }

    return {
      data: data.results,
      next: data.paging?.next?.after || null,
    };
  },
});
