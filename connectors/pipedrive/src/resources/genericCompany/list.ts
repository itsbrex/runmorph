import { List } from "@runmorph/cdk";

import PipedriveCompanyMapper, { type PipedriveCompany } from "./mapper";

interface PipedriveCompanyListResponse {
  data: PipedriveCompany[];
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
  scopes: ["organizations:read"],
  mapper: PipedriveCompanyMapper,
  handler: async (connection, { limit, cursor }) => {
    const { data, error } =
      await connection.proxy<PipedriveCompanyListResponse>({
        method: "GET",
        path: "/v1/organizations",
        query: { limit, start: cursor ? parseInt(cursor) : 0 },
      });

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
