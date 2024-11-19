import { Retrieve } from "@runmorph/cdk";

import PipedriveStageMapper, { type PipedriveStage } from "./mapper";

export default new Retrieve({
  scopes: ["deals.read"],
  mapper: PipedriveStageMapper,
  handler: async (connection, { id }) => {
    // Get the stage from Pipedrive API
    const { data: stageResponse, error: stageError } = await connection.proxy<{
      data: PipedriveStage;
    }>({
      method: "GET",
      path: `/stages/${id}`,
    });

    if (stageError) {
      return { error: stageError };
    }

    return stageResponse.data;
  },
});
