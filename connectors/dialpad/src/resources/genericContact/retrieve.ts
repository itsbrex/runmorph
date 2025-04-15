import { Retrieve } from "@runmorph/cdk";

import mapper, { type DialpadContact } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<DialpadContact>({
      method: "GET",
      path: `/v2/contacts/${id}`,
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
