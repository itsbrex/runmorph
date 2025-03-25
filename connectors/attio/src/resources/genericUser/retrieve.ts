import { Retrieve } from "@runmorph/cdk";

import mapper, { type AttioWorkspaceMember } from "./mapper";

interface AttioWorkspaceMemberResponse {
  data: AttioWorkspaceMember;
}

export default new Retrieve({
  scopes: ["user_management:read"],
  mapper: mapper,
  handler: async (connection, { id }) => {
    // Get a single workspace member by ID
    const { data, error } =
      await connection.proxy<AttioWorkspaceMemberResponse>({
        method: "GET",
        path: `/v2/workspace_members/${id}`,
      });

    if (error) {
      return { error };
    }

    return data.data;
  },
});
