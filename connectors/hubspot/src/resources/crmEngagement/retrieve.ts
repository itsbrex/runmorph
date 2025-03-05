import { Retrieve } from "@runmorph/cdk";

import HubSpotEngagementMapper, { type HubSpotEngagement } from "./mapper";

export default new Retrieve({
  scopes: ["sales-email-read"],
  mapper: HubSpotEngagementMapper,
  handler: async (connection, { id }) => {
    const { data, error } = await connection.proxy<HubSpotEngagement>({
      method: "GET",
      path: `/engagements/v1/engagements/${id}`,
    });

    if (error) {
      return { error };
    }

    return data;
  },
});
