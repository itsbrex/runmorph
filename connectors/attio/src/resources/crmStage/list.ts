import { List } from "@runmorph/cdk";

import mapper, { type AttioStatus } from "./mapper";

interface AttioStatusResponse {
  data: AttioStatus[];
}

export default new List({
  scopes: ["object_configuration:read"],
  mapper: mapper,
  handler: async (connection) => {
    // Get the statuses for the deals object's stage attribute
    const { data, error } = await connection.proxy<AttioStatusResponse>({
      method: "GET",
      path: "/v2/objects/deals/attributes/stage/statuses",
    });

    if (error) {
      return { error };
    }

    // Return the stages as a list
    return {
      data: data.data,
      next: null, // No pagination needed as we're getting all stages at once
    };
  },
});
