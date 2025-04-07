import { Retrieve } from "@runmorph/cdk";

import SalesforceContactMapper, { type SalesforceAccount } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: SalesforceContactMapper,
  handler: async (connection, { id, fields }) => {
    const { data, error } = await connection.proxy<SalesforceAccount>({
      method: "GET",
      path: `/services/data/v59.0/sobjects/Account/${id}`,
      query: {
        fields: fields.join(","),
      },
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
