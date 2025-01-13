import { Retrieve } from "@runmorph/cdk";

import SalesforceUserMapper, { type SalesforceUser } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: SalesforceUserMapper,
  handler: async (connection, { id, fields }) => {
    const { data, error } = await connection.proxy<SalesforceUser>({
      method: "GET",
      path: `/sobjects/User/${id}`,
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
