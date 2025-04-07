import { Retrieve } from "@runmorph/cdk";

import PipedrivePipelineMapper, { type PipedrivePipeline } from "./mapper";

export default new Retrieve({
  scopes: ["deals.read"],
  mapper: PipedrivePipelineMapper,
  handler: async (connection, { id, fields }) => {
    // Get the pipeline from Pipedrive API
    const { data: pipelineResponse, error: pipelineError } =
      await connection.proxy<{ data: PipedrivePipeline }>({
        method: "GET",
        path: `/v1/pipelines/${id}`,
      });

    if (pipelineError) {
      return { error: pipelineError };
    }

    let stages: PipedrivePipeline["_stages"] = [];
    if (fields.includes("_stages")) {
      // Get stages for the pipeline only if _stages field is requested
      const { data: stagesResponse, error: stagesError } =
        await connection.proxy<{
          data: PipedrivePipeline["_stages"];
        }>({
          method: "GET",
          path: "/v1/stages",
          query: {
            pipeline_id: id,
          },
        });

      if (stagesError) {
        return { error: stagesError };
      }

      stages = stagesResponse.data;
    }

    // Combine pipeline and stages data
    const combinedData: PipedrivePipeline = {
      ...pipelineResponse.data,
      _stages: stages,
    };

    return combinedData;
  },
});
