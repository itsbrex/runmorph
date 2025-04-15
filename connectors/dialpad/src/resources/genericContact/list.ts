import { List } from "@runmorph/cdk";

import mapper, { type DialpadContact } from "./mapper";

interface DialpadContactListResponse {
  items?: DialpadContact[];
  cursor?: string;
}

export default new List({
  scopes: [],
  mapper,
  handler: async (connection, { cursor }) => {
    const { data, error } = await connection.proxy<DialpadContactListResponse>({
      method: "GET",
      path: "/v2/contacts",
      query: {
        cursor,
        include_local: false,
      },
    });

    if (error) {
      return { error };
    }

    return {
      data: data.items || [],
      next: data.cursor || null,
    };
  },
});
