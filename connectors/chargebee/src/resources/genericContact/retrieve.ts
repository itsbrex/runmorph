import { Retrieve } from "@runmorph/cdk";

import mapper, { type ChargebeeCustomer } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<{
      customer: ChargebeeCustomer;
    }>({
      method: "GET",
      path: `/v2/customers/${id}`,
    });

    if (error) {
      return { error };
    }

    return data.customer;
  },
});
