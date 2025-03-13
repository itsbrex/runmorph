import { Retrieve } from "@runmorph/cdk";

import mapper, { type DialpadCall } from "./mapper";

export default new Retrieve({
  scopes: ["recordings_export"],
  mapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<DialpadCall>({
      method: "GET",
      path: `/v2/call/${id}`,
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
