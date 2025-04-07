import { Retrieve } from "@runmorph/cdk";

import PipedriveContactMapper, { type PipedriveContact } from "./mapper";

export default new Retrieve({
  scopes: ["contacts.read"],
  mapper: PipedriveContactMapper,
  handler: async (connection, { id, fields }) => {
    // Get the contact from HubSpot API
    const { data, error } = await connection.proxy<PipedriveContact>({
      method: "GET",
      path: `/v1/persons/${id}`,
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
