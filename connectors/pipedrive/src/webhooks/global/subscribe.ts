import { SubscribeToGlobalEvent } from "@runmorph/cdk";

import PipedriveGlobalEventMapper from "./mapper";

export default new SubscribeToGlobalEvent({
  globalEventMapper: PipedriveGlobalEventMapper,
  handler: async (connection, { globalRoute }) => {
    // TODO : get portalId from connection.getMeta("portalId")
    const { data: accountData, error } = await connection.proxy<{
      data: { company_id: string };
    }>({
      method: "GET",
      path: "/users/me",
    });

    if (error) {
      return { error };
    }

    const portalId = accountData.data.company_id;

    if (globalRoute === "cardView") {
      return {
        identifierKey: `${portalId}-${globalRoute}-widgetCardView-created`, // TODO: define identierKey composable (portalId, globalRoute, ...) so it become typesafe across sub and mapper
      };
    } else {
      // TODO : if route infered proeperly, this shouldn't be necessary
      return {
        error: {
          code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
          message: `The global webhook route '${globalRoute}' does not exist on the HubSpot connector.`,
        },
      };
    }
  },
});
