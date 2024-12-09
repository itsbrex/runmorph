import { List } from "@runmorph/cdk";

import PipedriveDealMapper, { type PipedriveDeal } from "./mapper";

interface PipedriveDealListResponse {
  data: PipedriveDeal[];
  additional_data: {
    pagination: {
      start: number;
      limit: number;
      more_items_in_collection: boolean;
      next_start: number;
    };
  };
}

export default new List({
  scopes: ["deals.read"],
  mapper: PipedriveDealMapper,
  handler: async (connection, { limit, cursor }) => {
    const { data, error } = await connection.proxy<PipedriveDealListResponse>({
      method: "GET",
      path: "/deals",
      query: { limit, start: cursor ? parseInt(cursor) : 0 },
    });

    if (error) {
      return { error };
    }

    return {
      data: data.data,
      next: data.additional_data?.pagination?.next_start.toString() || null,
    };
  },
});
