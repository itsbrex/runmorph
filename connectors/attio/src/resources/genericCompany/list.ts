import { List } from "@runmorph/cdk";

import mapper, { type AttioCompany } from "./mapper";

interface AttioListResponse {
  data: AttioCompany[];
}

interface AttioListParams {
  limit?: number;
  offset?: number;
}

export default new List({
  scopes: [],
  mapper: mapper,
  handler: async (connection, { limit, cursor }) => {
    const requestData: AttioListParams = {
      limit,
      offset: cursor ? parseInt(cursor) : 0,
    };

    const { data, error } = await connection.proxy<AttioListResponse>({
      method: "POST",
      path: "/v2/objects/companies/records/query",
      data: requestData,
    });

    if (error) {
      return { error };
    }

    const nextOffset = (requestData.offset || 0) + (data.data?.length || 0);
    const hasMore = data.data?.length === requestData.limit;

    return {
      data: data.data,
      next: hasMore ? nextOffset.toString() : null,
    };
  },
});
