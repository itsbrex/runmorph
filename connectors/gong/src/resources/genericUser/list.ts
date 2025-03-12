import { List } from "@runmorph/cdk";

import mapper, { type GongUser } from "./mapper";

interface GongUserListResponse {
  requestId: string;
  records: {
    totalRecords: number;
    currentPageSize: number;
    currentPageNumber: number;
    cursor: string;
  };
  users: GongUser[];
}

export default new List({
  scopes: ["api:users:read"],
  mapper,
  handler: async (connection, { limit, cursor }) => {
    const { data, error } = await connection.proxy<GongUserListResponse>({
      method: "GET",
      path: "/v2/users",
      query: {
        cursor: cursor || undefined,
      },
    });

    if (error) {
      return { error };
    }

    return {
      data: data.users,
      next: data.records.cursor || null,
    };
  },
});
