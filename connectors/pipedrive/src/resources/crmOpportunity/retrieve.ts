import { Retrieve } from "@runmorph/cdk";

import PipedriveDealMapper, { type PipedriveDeal } from "./mapper";

export default new Retrieve({
  scopes: ["deals.read"],
  mapper: PipedriveDealMapper,
  handler: async (connection, { id }) => {
    // Get the deal from Pipedrive API
    const { data, error } = await connection.proxy<{ data: PipedriveDeal }>({
      method: "GET",
      path: `/deals/${id}`,
    });

    if (error) {
      return { error };
    }

    return data.data;
  },
});
