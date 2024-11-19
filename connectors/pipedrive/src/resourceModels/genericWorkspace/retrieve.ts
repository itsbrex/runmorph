import { Retrieve } from "@runmorph/cdk";

import WorkspaceMapper, { type PipedriveWorkspace } from "./mapper";

export default new Retrieve({
  scopes: ["users:read"],
  mapper: WorkspaceMapper,
  handler: async (connection) => {
    // Get the workspace info from Pipedrive API
    const { data, error } = await connection.proxy<PipedriveWorkspace>({
      method: "GET",
      path: "/users/me",
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
