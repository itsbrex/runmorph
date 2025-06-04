import { Create } from "@runmorph/cdk";

import PipedrivePersonMapper, { type PipedriveContact } from "./mapper";

export default new Create({
  scopes: ["persons:write"],
  mapper: PipedrivePersonMapper,
  handler: async (connection, { data }) => {
    console.log("create data", data);
    // Create the person in Pipedrive API
    const { data: response, error } = await connection.proxy<{
      data: PipedriveContact;
    }>({
      method: "POST",
      path: "/v1/persons",
      data,
    });

    if (error) {
      return { error };
    }

    return response.data;
  },
});
