import { Retrieve } from "@runmorph/cdk";

import type { SalesforceStage } from "../crmStage/mapper";

import SalesforceOpportunityMapper, {
  type SalesforceOpportunity,
} from "./mapper";

interface SalesforceQueryStageResponse {
  records: SalesforceStage[];
  done: boolean;
  totalSize: number;
}

export default new Retrieve({
  scopes: [],
  mapper: SalesforceOpportunityMapper,
  handler: async (connection, { id, fields }) => {
    const { data, error } = await connection.proxy<SalesforceOpportunity>({
      method: "GET",
      path: `/services/data/v59.0/sobjects/Opportunity/${id}`,
      query: {
        fields: fields.join(","),
      },
    });

    if (error) {
      return { error };
    }

    const sfStageMasterLabel = data.StageName;
    let stageId;
    if (sfStageMasterLabel) {
      const { data: stageData, error: satgeError } =
        await connection.proxy<SalesforceQueryStageResponse>({
          method: "GET",
          path: `/services/data/v59.0/query`,
          query: {
            q: `SELECT Id FROM OpportunityStage WHERE MasterLabel = '${sfStageMasterLabel}'`,
          },
        });

      if (!satgeError && stageData.records[0]?.Id) {
        stageId = stageData.records[0]?.Id;
      }
    }
    return stageId ? { ...data, stageId: stageId } : data;
  },
});
