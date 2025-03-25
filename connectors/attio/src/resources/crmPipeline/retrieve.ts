import { Retrieve } from "@runmorph/cdk";

import mapper, { type AttioObject, type AttioStatus } from "./mapper";

interface AttioStatusResponse {
  data: AttioStatus[];
}
interface AttioObjectResponse {
  data: AttioObject;
}
export default new Retrieve({
  scopes: ["object_configuration:read"],
  mapper: mapper,
  handler: async (connection, { id }) => {
    // Get the pipeline object from Attio API
    const { data: objectData, error: objectError } =
      await connection.proxy<AttioObjectResponse>({
        method: "GET",
        path: `/v2/objects/${id}`,
      });

    if (objectError) {
      return { error: objectError };
    }

    // Get the statuses for the object
    const { data: statusData, error: statusError } =
      await connection.proxy<AttioStatusResponse>({
        method: "GET",
        path: `/v2/objects/${id}/attributes/stage/statuses`,
      });

    if (statusError) {
      return { error: statusError };
    }

    // Combine the object data with the statuses
    return {
      ...objectData.data,
      _status: statusData.data,
    };
  },
});
