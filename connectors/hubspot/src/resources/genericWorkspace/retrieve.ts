import { Retrieve } from "@runmorph/cdk";

import WorkspaceMapper, { type HubSpotAccountInfo } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: WorkspaceMapper,
  handler: async (connection) => {
    // Get the workspace (account) info from HubSpot API
    const { data, error } = await connection.proxy<HubSpotAccountInfo>({
      method: "GET",
      path: `/account-info/v3/details`,
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
