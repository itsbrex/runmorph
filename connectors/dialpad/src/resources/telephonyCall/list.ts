import { List } from "@runmorph/cdk";

import mapper, { type DialpadCall } from "./mapper";

interface DialpadCallListResponse {
  items: DialpadCall[];
  cursor?: string;
}

export default new List({
  scopes: ["calls:list", "recordings_export"],
  mapper,
  handler: async (connection, { cursor }) => {
    const { data, error } = await connection.proxy<DialpadCallListResponse>({
      method: "GET",
      path: "/v2/call",
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
