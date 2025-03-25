import { Create } from "@runmorph/cdk";

import mapper, { type AttioCompany } from "./mapper";

export default new Create({
  scopes: [],
  mapper: mapper,
  handler: async (connection, { data }) => {
    // Create a new company in Attio API
    const { data: responseData, error } = await connection.proxy<{
      data: AttioCompany;
    }>({
      method: "POST",
      path: "/v2/objects/companies/records",
      data: {
        data,
      },
    });

    if (error) {
      return { error };
    }

    return responseData.data;
  },
});
