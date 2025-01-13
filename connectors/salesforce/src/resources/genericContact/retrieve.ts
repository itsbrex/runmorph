import { Retrieve } from "@runmorph/cdk";

import SalesforceContactMapper, { type SalesforceContact } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: SalesforceContactMapper,
  handler: async (connection, { id, fields }) => {
    const { data, error } = await connection.proxy<SalesforceContact>({
      method: "GET",
      path: `/sobjects/Contact/${id}`,
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
