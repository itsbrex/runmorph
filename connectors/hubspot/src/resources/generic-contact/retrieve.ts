import { Retrieve } from "@runmorph/cdk";

import HubSpotContactSchema, { type HubSpotContact } from "./mapper";

export default new Retrieve({
  schema: HubSpotContactSchema,
  scopes: [],
  handler: async (connection, { id, fields }) => {
    // Make the GET request to the HubSpot API
    const { data, error } = await connection.proxy({
      method: "GET",
      path: `/crm/v3/objects/contacts/${id}`,
      query: {
        properties: fields,
      },
      headers: {},
    });

    if (error) {
      throw error;
    }

    return data as HubSpotContact;
  },
});
