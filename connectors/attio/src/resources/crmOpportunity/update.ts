import { Update } from "@runmorph/cdk";

import mapper, { type AttioDeal } from "./mapper";

export default new Update({
  scopes: [],
  mapper: mapper,
  handler: async (connection, { id, data }) => {
    // Update the deal in Attio API
    const { data: responseData, error } = await connection.proxy<{
      data: AttioDeal;
    }>({
      method: "PATCH",
      path: `/v2/objects/deals/records/${id}`,
      data: {
        data,
      },
    });

    if (error) {
      return { error };
    }

    return responseData.data;
  },
});
