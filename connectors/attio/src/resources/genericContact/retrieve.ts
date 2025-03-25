import { Retrieve } from "@runmorph/cdk";

import mapper, { type AttioPerson } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: mapper,
  handler: async (connection, { id }) => {
    // Get the person from Attio API
    const { data, error } = await connection.proxy<{ data: AttioPerson }>({
      method: "GET",
      path: `/v2/objects/people/records/${id}`,
    });

    if (error) {
      return { error };
    }

    return data.data;
  },
});
