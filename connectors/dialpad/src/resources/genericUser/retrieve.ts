import { Retrieve } from "@runmorph/cdk";

import mapper, { type DialpadUser } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<DialpadUser>({
      method: "GET",
      path: `/v2/users/${id}`,
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
