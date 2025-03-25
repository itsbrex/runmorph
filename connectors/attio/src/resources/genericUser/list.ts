import { List } from "@runmorph/cdk";

import mapper, { type AttioWorkspaceMember } from "./mapper";

interface AttioWorkspaceMembersResponse {
  data: AttioWorkspaceMember[];
}

export default new List({
  scopes: ["user_management:read"],
  mapper: mapper,
  handler: async (connection) => {
    // Get all workspace members
    const { data, error } =
      await connection.proxy<AttioWorkspaceMembersResponse>({
        method: "GET",
        path: "/v2/workspace_members",
      });

    if (error) {
      return { error };
    }

    // Return the workspace members as a list
    return {
      data: data.data,
      next: null, // No pagination needed as we're getting all members at once
    };
  },
});
