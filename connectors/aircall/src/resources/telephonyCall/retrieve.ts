import { Retrieve } from "@runmorph/cdk";

import mapper, { type AircallCall } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<{ call: AircallCall }>({
      method: "GET",
      path: `/v1/calls/${id}`,
    });

    if (error) {
      return { error };
    }

    return data.call;
  },
});
