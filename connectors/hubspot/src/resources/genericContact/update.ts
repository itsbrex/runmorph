import { Update } from "@runmorph/cdk";

import HubSpotContactMapper, { type HubSpotContact } from "./mapper";

export default new Update({
  scopes: ["crm.objects.contacts.write"],
  mapper: HubSpotContactMapper,
  handler: async (connection, { id, data }) => {
    // Update the contact in HubSpot API
    const { data: response, error } = await connection.proxy<HubSpotContact>({
      method: "PATCH",
      path: `/crm/v3/objects/contacts/${id}`,
      data,
    });

    if (error) {
      return { error };
    }

    return response;
  },
});
