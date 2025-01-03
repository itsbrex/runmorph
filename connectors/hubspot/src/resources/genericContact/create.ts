import { Create } from "@runmorph/cdk";

import HubSpotContactMapper, { type HubSpotContact } from "./mapper";

export default new Create({
  scopes: ["crm.objects.contacts.write"],
  mapper: HubSpotContactMapper,
  handler: async (connection, { data }) => {
    // Create a new contact in HubSpot API
    const { data: response, error } = await connection.proxy<HubSpotContact>({
      method: "POST",
      path: "/crm/v3/objects/contacts",
      data,
    });

    if (error) {
      return { error };
    }

    return response;
  },
});
