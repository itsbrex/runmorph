import { CreateGlobalEventSubscription } from "@runmorph/cdk";

import HubSpotGlobalEventMapper from "./mapper";

export default new CreateGlobalEventSubscription({
  globalEventMapper: HubSpotGlobalEventMapper,
  handler: async (connection, { model, trigger, globalRoute }) => {
    const { data, error } = await connection.proxy<{ portalId: string }>({
      method: "GET",
      path: `/account-info/v3/details`,
    });

    if (error) {
      throw error;
    }

    return {
      identifierKey: `${data.portalId}::${globalRoute}::${model}::${trigger}`,
      meta: {
        portalId: data.portalId,
      },
    };
  },
});
