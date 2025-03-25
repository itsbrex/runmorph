import { Retrieve } from "@runmorph/cdk";

import mapper, { type AttioDeal } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: mapper,
  handler: async (connection, { id }) => {
    // Get the person from Attio API
    const { data, error } = await connection.proxy<{ data: AttioDeal }>({
      method: "GET",
      path: `/v2/objects/deals/records/${id}`,
    });

    if (error) {
      return { error };
    }

    return data.data;
  },
});
