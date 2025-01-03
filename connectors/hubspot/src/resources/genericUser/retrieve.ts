import { Retrieve } from "@runmorph/cdk";

import HubSpotUserMapper, { type HubSpotUser } from "./mapper";

export default new Retrieve({
  scopes: ["crm.objects.owners.read"],
  mapper: HubSpotUserMapper,
  handler: async (connection, { id, fields }) => {
    // Get the user from HubSpot API
    const query: Record<string, string | string[]> = {
      properties: fields,
    };

    const { data, error } = await connection.proxy<HubSpotUser>({
      method: "GET",
      path: `/crm/v3/owners/${id}`,
      query,
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
