import { Update } from "@runmorph/cdk";

import type { SalesforceQueryStageResponse } from "../crmStage/mapper";

import SalesforceOpportunityMapper, {
  type SalesforceOpportunity,
} from "./mapper";

export default new Update({
  scopes: [],
  mapper: SalesforceOpportunityMapper,
  handler: async (connection, { id, data }) => {
    // If stage is being updated, we need to get the MasterLabel
    const defaultOpportunityPipelineId = "Opportunity";
    if (data.stageId) {
      const { data: stageData, error: stageError } =
        await connection.proxy<SalesforceQueryStageResponse>({
          method: "GET",
          path: `/services/data/v59.0/query`,
          query: {
            q: `SELECT MasterLabel FROM ${defaultOpportunityPipelineId}Stage WHERE Id = '${data.stageId}'`,
          },
        });

      if (!stageError && stageData.records[0]?.MasterLabel) {
        data.StageName = stageData.records[0].MasterLabel;
      }
    }

    // Remove stageId as it's not a field in Salesforce Opportunity
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- extract value
    const { stageId, ...updateData } = data;

    const { error } = await connection.proxy({
      method: "PATCH",
      path: `/services/data/v59.0/sobjects/Opportunity/${id}`,
      data: updateData,
    });

    if (error) {
      return { error };
    }

    // For PATCH requests, Salesforce doesn't return the updated object
    // Refacto – should have the choice of returning rawResource OR resourceRef only
    return {
      Id: id,
      CreatedDate: new Date().toISOString(),
      LastModifiedDate: new Date().toISOString(),
    } as SalesforceOpportunity;
  },
});
