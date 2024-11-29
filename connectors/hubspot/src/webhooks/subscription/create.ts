import { CreateEventSubscription } from "@runmorph/cdk";

import HubSpotEventMapper, {
  eventToHubSpotEvent,
  modelToHubSpotObject,
} from "./mapper";

type HubSpotWebhookSubscriptionResponse = {
  id: string;
  subscriptionType: string;
  propertyName?: string;
  url: string;
  secretKey: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
};

export default new CreateEventSubscription({
  eventMapper: HubSpotEventMapper,
  handler: async (connection, { model, trigger, url }) => {
    const { data: w, error: we } = await connection.proxy<{ portalId: string }>(
      {
        method: "GET",
        path: `/account-info/v3/details`,
      }
    );

    if (we) {
      return { error: we };
    }

    const { data, error } =
      await connection.proxy<HubSpotWebhookSubscriptionResponse>({
        method: "POST",
        path: `/webhooks/v3/${w.portalId}/subscriptions`,
        data: {
          subscriptionType: `${modelToHubSpotObject[model]}.${eventToHubSpotEvent[trigger]}}`,
          url: url,
          active: true,
        },
      });

    if (error) {
      return { error };
    }

    return {
      id: data.id,
      meta: {
        secret: data.secretKey,
      },
    };
  },
});
