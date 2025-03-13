import { UnsubscribeFromEvent } from "@runmorph/cdk";

import DialpadEventMapper from "./mapper";

export default new UnsubscribeFromEvent({
  eventMapper: DialpadEventMapper,
  handler: async (connection, { metadata }) => {
    // Delete subscription first
    const subscriptionResponse = await connection.proxy({
      path: `/v2/subscriptions/${metadata.subscriptionType}/${metadata.subscriptionId}`,
      method: "DELETE",
    });

    if (subscriptionResponse.error) {
      return { error: subscriptionResponse.error };
    }

    // Then delete webhook
    const webhookResponse = await connection.proxy({
      path: `/v2/webhooks/${metadata.webhookId}`,
      method: "DELETE",
    });

    if (webhookResponse.error) {
      return { error: webhookResponse.error };
    }

    return;
  },
});
