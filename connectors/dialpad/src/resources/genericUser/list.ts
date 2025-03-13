import { List } from "@runmorph/cdk";

import mapper, { type DialpadUser } from "./mapper";

interface DialpadUserListResponse {
  items: DialpadUser[];
  cursor?: string;
}

export default new List({
  scopes: [],
  mapper,
  handler: async (connection, { cursor }) => {
    const { data, error } = await connection.proxy<DialpadUserListResponse>({
      method: "GET",
      path: "/v2/users",
      query: {
        cursor,
      },
    });

    if (error) {
      return { error };
    }

    return {
      data: data.items,
      next: data.cursor || null,
    };
  },
});
