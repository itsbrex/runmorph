import { Retrieve } from "@runmorph/cdk";

import PipedriveCompanyMapper, { type PipedriveCompany } from "./mapper";

export default new Retrieve({
  scopes: ["organizations.read"],
  mapper: PipedriveCompanyMapper,
  handler: async (connection, { id, fields }) => {
    // Get the organization from Pipedrive API
    const { data, error } = await connection.proxy<PipedriveCompany>({
      method: "GET",
      path: `/v1/organizations/${id}`,
      query: {
        fields: fields,
      },
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
