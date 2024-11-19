import { Retrieve } from "@runmorph/cdk";

import PipedriveUserMapper, { type PipedriveUser } from "./mapper";

export default new Retrieve({
  scopes: ["users:read"],
  mapper: PipedriveUserMapper,
  handler: async (connection, { id }) => {
    // Get the contact from HubSpot API
    const { data, error } = await connection.proxy<PipedriveUser>({
      method: "GET",
      path: `/users/${id}`,
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
