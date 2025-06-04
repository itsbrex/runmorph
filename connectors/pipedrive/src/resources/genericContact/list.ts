import { List } from "@runmorph/cdk";

import PipedrivePersonMapper, { type PipedriveContact } from "./mapper";

interface PipedrivePersonListResponse {
  data: PipedriveContact[];
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
  scopes: ["persons:read"],
  mapper: PipedrivePersonMapper,
  handler: async (connection, { limit, cursor }) => {
    const { data, error } = await connection.proxy<PipedrivePersonListResponse>(
      {
        method: "GET",
        path: "/v1/persons",
        query: { limit, start: cursor ? parseInt(cursor) : 0 },
      }
    );

    if (error) {
      return { error };
    }

    return {
      data: data.data || [],
      next: data.additional_data?.pagination?.more_items_in_collection
        ? data.additional_data.pagination.next_start.toString()
        : null,
    };
  },
});
