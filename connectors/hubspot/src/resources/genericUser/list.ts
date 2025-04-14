import { List } from "@runmorph/cdk";

import HubSpotUserMapper, { type HubSpotUser } from "./mapper";

export default new List({
  scopes: ["crm.objects.owners.read"],
  mapper: HubSpotUserMapper,
  handler: async (connection, { fields, q }) => {
    // Get the user from HubSpot API
    const query: Record<string, string | string[]> = {
      properties: fields,
    };

    const { data, error } = await connection.proxy<{ results: HubSpotUser[] }>({
      method: "GET",
      path: `/crm/v3/owners`,
      query,
    });

    if (error) {
      return { error };
    }

    let filteredData = data.results;
    if (q) {
      filteredData = filteredData.filter((user) => {
        const searchTerm = q.raw.toLowerCase();
        if (q.type === "email") {
          return user.email.toLowerCase().includes(searchTerm);
        } else {
          return true;
        }
      });
    }

    return {
      data: filteredData,
      next: null,
    };
  },
});
