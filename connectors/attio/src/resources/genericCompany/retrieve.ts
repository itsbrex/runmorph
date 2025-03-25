import { Retrieve } from "@runmorph/cdk";

import mapper, { type AttioCompany } from "./mapper";

export default new Retrieve({
  scopes: [],
  mapper: mapper,
  handler: async (connection, { id }) => {
    // Get the person from Attio API
    const { data, error } = await connection.proxy<{ data: AttioCompany }>({
      method: "GET",
      path: `/v2/objects/companies/records/${id}`,
    });

    if (error) {
      return { error };
    }

    return data.data;
  },
});
