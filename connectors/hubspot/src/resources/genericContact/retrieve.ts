import { Retrieve } from "@runmorph/cdk";

import HubSpotContactMapper, { type HubSpotContact } from "./mapper";

export default new Retrieve({
  scopes: ["crm.objects.contacts.read"],
  mapper: HubSpotContactMapper,
  handler: async (connection, { id, fields }) => {
    // Get the contact from HubSpot API
    const { data, error } = await connection.proxy<HubSpotContact>({
      method: "GET",
      path: `/crm/v3/objects/contacts/${id}`,
      query: {
        properties: fields,
      },
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
