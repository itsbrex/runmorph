import { SubscribeToGlobalEvent } from "@runmorph/cdk";

import PipedriveGlobalEventMapper from "./mapper";

export default new SubscribeToGlobalEvent({
  globalEventMapper: PipedriveGlobalEventMapper,
  handler: async (connection, { route }) => {
    const { data: accountData, error } = await connection.proxy<{
      data: { company_id: number };
    }>({
      method: "GET",
      path: "/users/me",
    });

    if (error) {
      return { error };
    }

    const portalId = accountData.data.company_id;

    if (route === "cardView") {
      return {
        identifierKey: portalId.toString(), // TODO: define identierKey composable (portalId, globalRoute, ...) so it become typesafe across sub and mapper
      };
    } else {
      return {
        error: {
          code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
          message: `The global webhook route '${route}' does not exist on the HubSpot connector.`,
        },
      };
    }
  },
});
