import { SubscribeToEvent } from "@runmorph/cdk";

import AircallEventMapper from "./mapper";

type AircallWebhook = {
  webhook_id: string;
  token: string;
};

const AIRCALL_EVENT_MAP = {
  telephonyCall: {
    created: ["call.created"],
    updated: [
      "call.ringing_on_agent",
      "call.agent_declined",
      "call.answered",
      "call.transferred",
      "call.ended",
      "call.voicemail_left",
      "call.commented",
      "call.tagged",
      "call.untagged",
      "call.assigned",
      "call.comm_assets_generated",
    ],
  },
};

const getEvents = (
  model: keyof typeof AIRCALL_EVENT_MAP,
  trigger: string
): string[] | undefined => {
  const modelEvents = AIRCALL_EVENT_MAP[model];
  if (!modelEvents) {
    return undefined;
  }

  // Check if trigger exists in the model's events
  if (!(trigger in modelEvents)) {
    return undefined;
  }

  return modelEvents[trigger as keyof typeof modelEvents];
};

export default new SubscribeToEvent({
  eventMapper: AircallEventMapper,
  handler: async (connection, { model, trigger, url }) => {
    const events = getEvents(model, trigger);
    if (!events) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
          message: `The ${model}::${trigger} event is not currently suported by the Aircall connector.`,
        },
      };
    }
    const { data, error } = await connection.proxy<{
      webhook: AircallWebhook;
    }>({
      method: "POST",
      path: "/v1/webhooks",
      data: {
        url,
        events,
      },
    });

    if (error) {
      return { error };
    }

    return {
      metadata: {
        webhookId: data.webhook.webhook_id,
        webookToken: data.webhook.token,
      },
    };
  },
});
