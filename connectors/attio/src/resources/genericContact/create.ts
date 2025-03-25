import { Create } from "@runmorph/cdk";

import mapper, { type AttioPerson } from "./mapper";

export default new Create({
  scopes: [],
  mapper: mapper,
  handler: async (connection, { data }) => {
    // Create a new person in Attio API
    const { data: responseData, error } = await connection.proxy<{
      data: AttioPerson;
    }>({
      method: "POST",
      path: "/v2/objects/people/records",
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
