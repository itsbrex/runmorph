import { List } from "@runmorph/cdk";

import PipedrivePipelineMapper, { type PipedrivePipeline } from "./mapper";

export default new List({
  scopes: ["deals.read"],
  mapper: PipedrivePipelineMapper,
  handler: async (connection) => {
    // Get all pipelines from Pipedrive API
    const { data: pipelinesResponse, error: pipelinesError } =
      await connection.proxy<{ data: PipedrivePipeline[] }>({
        method: "GET",
        path: "/pipelines",
      });

    if (pipelinesError) {
      return { error: pipelinesError };
    }

    // Get all stages for all pipelines
    const { data: allStagesResponse, error: allStagesError } =
      await connection.proxy<{
        data: PipedrivePipeline["_stages"];
      }>({
        method: "GET",
        path: "/stages",
      });

    if (allStagesError) {
      return { error: allStagesError };
    }

    const allStages = allStagesResponse.data;

    // Combine pipeline and stages data
    return {
      data: pipelinesResponse.data.map((pipeline) => ({
        ...pipeline,
        _stages: allStages.filter((stage) => stage.pipeline_id === pipeline.id),
      })),
      next: null,
    };
  },
});
