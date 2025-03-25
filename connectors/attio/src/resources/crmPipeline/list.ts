import { List } from "@runmorph/cdk";

import mapper, { type AttioObject, type AttioStatus } from "./mapper";

interface AttioStatusResponse {
  data: AttioStatus[];
}

interface AttioObjectResponse {
  data: AttioObject;
}

export default new List({
  scopes: ["object_configuration:read"],
  mapper: mapper,
  handler: async (connection) => {
    // Get the deals object from Attio API
    const { data: objectData, error: objectError } =
      await connection.proxy<AttioObjectResponse>({
        method: "GET",
        path: "/v2/objects/deals",
      });

    if (objectError) {
      return { error: objectError };
    }

    // Get the statuses for the deals object
    const { data: statusData, error: statusError } =
      await connection.proxy<AttioStatusResponse>({
        method: "GET",
        path: "/v2/objects/deals/attributes/stage/statuses",
      });

    if (statusError) {
      return { error: statusError };
    }

    // Combine the object data with the statuses
    const enrichedData = {
      ...objectData.data,
      _status: statusData.data,
    };

    // Return the object data as a single-item list
    return {
      data: [enrichedData],
      next: null, // No pagination needed as we're just getting a single object
    };
  },
});
