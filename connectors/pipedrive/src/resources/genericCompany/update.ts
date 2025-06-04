import { Update } from "@runmorph/cdk";

import PipedriveOrganizationMapper, { type PipedriveCompany } from "./mapper";

export default new Update({
  scopes: ["organizations:write"],
  mapper: PipedriveOrganizationMapper,
  handler: async (connection, { id, data }) => {
    // Update the organization in Pipedrive API
    const { data: response, error } = await connection.proxy<{
      data: PipedriveCompany;
    }>({
      method: "PUT",
      path: `/v1/organizations/${id}`,
      data,
    });

    if (error) {
      return { error };
    }

    return response.data;
  },
});
