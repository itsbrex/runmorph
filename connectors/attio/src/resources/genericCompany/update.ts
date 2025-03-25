import { Update } from "@runmorph/cdk";

import mapper, { type AttioCompany } from "./mapper";

export default new Update({
  scopes: [],
  mapper: mapper,
  handler: async (connection, { id, data }) => {
    // Update the company in Attio API
    const { data: responseData, error } = await connection.proxy<{
      data: AttioCompany;
    }>({
      method: "PATCH",
      path: `/v2/objects/companies/records/${id}`,
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
