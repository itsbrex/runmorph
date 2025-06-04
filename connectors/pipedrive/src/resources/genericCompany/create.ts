import { Create } from "@runmorph/cdk";

import PipedriveOrganizationMapper, { type PipedriveCompany } from "./mapper";

export default new Create({
  scopes: ["organizations:write"],
  mapper: PipedriveOrganizationMapper,
  handler: async (connection, { data }) => {
    console.log("create data", data);
    // Create the organization in Pipedrive API
    const { data: response, error } = await connection.proxy<{
      data: PipedriveCompany;
    }>({
      method: "POST",
      path: "/v1/organizations",
      data,
    });

    if (error) {
      return { error };
    }

    return response.data;
  },
});
