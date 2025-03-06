import { Retrieve } from "@runmorph/cdk";

import mapper, { type AircallUser } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<{ user: AircallUser }>({
      method: "GET",
      path: `/v1/users/${id}`,
    });

    if (error) {
      return { error };
    }

    return data.user;
  },
});
