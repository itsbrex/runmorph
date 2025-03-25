import { Create } from "@runmorph/cdk";

import mapper, { type AttioDeal } from "./mapper";

export default new Create({
  scopes: [],
  mapper: mapper,
  handler: async (connection, { data }) => {
    // Create a new deal in Attio API
    const { data: responseData, error } = await connection.proxy<{
      data: AttioDeal;
    }>({
      method: "POST",
      path: "/v2/objects/deals/records",
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
