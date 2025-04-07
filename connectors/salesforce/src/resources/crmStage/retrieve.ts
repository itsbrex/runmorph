import { Retrieve } from "@runmorph/cdk";

import SalesforceStageMapper, {
  type SalesforceQueryStageResponse,
} from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: SalesforceStageMapper,
  handler: async (connection, { id, fields }) => {
    const { data, error } =
      await connection.proxy<SalesforceQueryStageResponse>({
        method: "GET",
        path: `/services/data/v59.0/query`,
        query: {
          q: `SELECT ${fields.join(",")} FROM OpportunityStage WHERE Id = '${id}'`,
        },
      });

    if (error) {
      return { error };
    }

    return data.records[0] || {};
  },
});
