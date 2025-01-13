import { List } from "@runmorph/cdk";

import { SalesforceQueryStageResponse } from "../crmStage/mapper";

import SalesforceContactMapper from "./mapper";

export default new List({
  scopes: [],
  mapper: SalesforceContactMapper,
  handler: async (connection) => {
    const defaultOpportunityPipelineId = "Opportunity";
    const { data, error } =
      await connection.proxy<SalesforceQueryStageResponse>({
        method: "GET",
        path: `/query`,
        query: {
          q: `SELECT Id,CreatedDate,LastModifiedDate FROM ${defaultOpportunityPipelineId}Stage`,
        },
      });

    if (error) {
      return { error };
    }

    return {
      data: [{ Id: defaultOpportunityPipelineId, stages: data.records }],
      next: null,
    };
  },
});
