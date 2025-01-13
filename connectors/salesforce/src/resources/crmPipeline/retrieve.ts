import { Retrieve } from "@runmorph/cdk";

import type { SalesforceQueryStageResponse } from "../crmStage/mapper";

import SalesforceOpportunityMapper from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: SalesforceOpportunityMapper,
  handler: async (connection, { id }) => {
    const { data, error } =
      await connection.proxy<SalesforceQueryStageResponse>({
        method: "GET",
        path: `/query`,
        query: {
          q: `SELECT Id,CreatedDate,LastModifiedDate FROM ${id}Stage`,
        },
      });

    if (error) {
      return { error };
    }
    return { Id: id, stages: data.records };
  },
});
