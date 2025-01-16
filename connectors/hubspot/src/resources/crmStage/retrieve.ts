import { Retrieve } from "@runmorph/cdk";

import HubSpotStageMapper, { type HubSpotStage } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: HubSpotStageMapper,
  handler: async (connection, { id, fields }) => {
    // Extract HubSpot pipeline id and stage id from resource id
    const [pipelineId, stageId] = id.split("::");
    if (!pipelineId || !stageId) {
      return {
        error: {
          code: "CONNECTOR::OPERATION::BAD_REQUEST" as const,
          message: `Malformed id : should be pipelineId::stageId but got "${id}"`,
        },
      };
    }
    const query: Record<string, string | string[]> = {};

    if (fields.length > 0) {
      query.properties = fields;
    }

    const { data, error } = await connection.proxy<HubSpotStage>({
      method: "GET",
      path: `/crm/v3/pipelines/deals/${pipelineId}/stages/${stageId}`,
      query,
    });

    if (error) {
      return { error };
    }

    // Add _pipelineId id to HubSpot Stage object
    data._pipelineId = pipelineId;

    return data;
  },
});
