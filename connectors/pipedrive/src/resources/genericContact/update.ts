import { Update } from "@runmorph/cdk";

import PipedrivePersonMapper, { type PipedriveContact } from "./mapper";

export default new Update({
  scopes: ["persons:write"],
  mapper: PipedrivePersonMapper,
  handler: async (connection, { id, data }) => {
    // Update the person in Pipedrive API
    const { data: response, error } = await connection.proxy<{
      data: PipedriveContact;
    }>({
      method: "PUT",
      path: `/v1/persons/${id}`,
      data,
    });

    if (error) {
      return { error };
    }

    return response.data;
  },
});
