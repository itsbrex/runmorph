import { Retrieve } from "@runmorph/cdk";

import mapper, { type AttioWorkspace } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: mapper,
  handler: async (connection) => {
    // Get the current workspace information
    const { data, error } = await connection.proxy<AttioWorkspace>({
      method: "GET",
      path: "/v2/self",
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
