import { Update } from "@runmorph/cdk";

import PipedriveDealMapper, { type PipedriveDeal } from "./mapper";

export default new Update({
  scopes: ["deals.write"],
  mapper: PipedriveDealMapper,
  handler: async (connection, { id, data }) => {
    // Update the deal in HubSpot API
    const { data: response, error } = await connection.proxy<{
      data: PipedriveDeal;
    }>({
      method: "PUT",
      path: `/deals/${id}`,
      data,
    });

    if (error) {
      return { error };
    }

    return response.data;
  },
});
