import { UnsubscribeFromEvent } from "@runmorph/cdk";

import AircallEventMapper from "./mapper";

export default new UnsubscribeFromEvent({
  eventMapper: AircallEventMapper,
  handler: async (connection, { metadata }) => {
    const { webhookId } = metadata;
    if (!webhookId) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::UNSUBSCRIPTION_FAILED",
          message: "Metadata webhookId missing ",
        },
      };
    }
    const { error } = await connection.proxy({
      method: "DELETE",
      path: `/v1/webhooks/${webhookId}`,
    });

    if (error) {
      return { error };
    }

    return;
  },
});
