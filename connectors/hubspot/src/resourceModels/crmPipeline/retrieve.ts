import { Retrieve } from "@runmorph/cdk";

import HubSpotPipelineMapper, { type HubSpotPipeline } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: HubSpotPipelineMapper,
  handler: async (connection, { id, fields }) => {
    // Get the pipeline from HubSpot API

    const query: Record<string, string | string[]> = {};

    if (fields.length > 0) {
      query.properties = fields;
    }

    const { data, error } = await connection.proxy<HubSpotPipeline>({
      method: "GET",
      path: `/crm/v3/pipelines/deals/${id}`,
      query,
    });

    console.log("pipeliene data", data);

    if (error) {
      return { error };
    }

    return data;
  },
});
