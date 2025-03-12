import { Retrieve } from "@runmorph/cdk";

import mapper, { type AircallContact } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<{ contact: AircallContact }>(
      {
        method: "GET",
        path: `/v1/contacts/${id}`,
      }
    );

    if (error) {
      return { error };
    }

    return data.contact;
  },
});
