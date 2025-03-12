import { Retrieve } from "@runmorph/cdk";

import mapper, { type GongUser } from "./mapper";

export default new Retrieve({
  scopes: ["api:users:read"],
  mapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<{
      requestId: string;
      user: GongUser;
    }>({
      method: "GET",
      path: `/v2/users/${id}`,
    });

    if (error) {
      return { error };
    }

    return data.user;
  },
});
