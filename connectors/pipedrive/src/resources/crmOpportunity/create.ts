import { Create } from "@runmorph/cdk";

import PipedriveDealMapper, { type PipedriveDeal } from "./mapper";

export default new Create({
  scopes: ["deals.write"],
  mapper: PipedriveDealMapper,
  handler: async (connection, { data }) => {
    // Create the deal in Pipedrive API
    const { data: response, error } = await connection.proxy<{
      data: PipedriveDeal;
    }>({
      method: "POST",
      path: "/v1/deals",
      data,
    });

    if (error) {
      return { error };
    }

    return response.data;
  },
});
