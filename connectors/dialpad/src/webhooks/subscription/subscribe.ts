import { SubscribeToEvent } from "@runmorph/cdk";
import crypto from "crypto";

import DialpadEventMapper from "./mapper";

type WebhookResponse = {
  id: number;
  signature: {
    algo: string;
    secret: string;
  };
};

type SubscriptionResponse = {
  id: number;
};

const DIALPAD_EVENT_MAP = {
  telephonyCall: {
    created: {
      type: "call",
      states: ["ringing", "calling"],
    },
    updated: {
      type: "call",
      states: [
        "queued",
        "connected",
        "hold",
        "voicemail",
        "missed",
        "hangup",
        "recording",
        "hangup",
        "voicemail_uploaded",
      ],
    },
  },
};

const getEvents = (
  model: keyof typeof DIALPAD_EVENT_MAP,
  trigger: string
): { type: string; states: string[] } | undefined => {
  const modelEvents = DIALPAD_EVENT_MAP[model];
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
  eventMapper: DialpadEventMapper,
  handler: async (connection, { model, trigger, url }) => {
    // Create webhook with URL and secret
    const webhookResponse = await connection.proxy<WebhookResponse>({
      path: "/v2/webhooks",
      method: "POST",
      data: {
        hook_url: url,
        secret: crypto.randomUUID(),
      },
    });

    if (webhookResponse.error) {
      return { error: webhookResponse.error };
    }

    const webhookId = webhookResponse.data.id;
    const signatureAlgo = webhookResponse.data.signature.algo;
    const signatureSecret = webhookResponse.data.signature.secret;

    // Map model and trigger to event type and states
    const events = getEvents(model as keyof typeof DIALPAD_EVENT_MAP, trigger);
    if (!events) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
          message: `The ${model}::${trigger} event is not currently supported by the Dialpad connector.`,
        },
      };
    }

    // Create subscription for the webhook
    const subscriptionResponse = await connection.proxy<SubscriptionResponse>({
      path: `/v2/subscriptions/${events.type}`,
      method: "POST",
      data: {
        webhook_id: webhookId,
        call_states: events.states,
        enabled: true,
      },
    });

    if (subscriptionResponse.error) {
      return { error: subscriptionResponse.error };
    }

    return {
      metadata: {
        webhookId: webhookId.toString(),
        subscriptionId: subscriptionResponse.data.id.toString(),
        subscriptionType: events.type,
        _signatureAlgo: signatureAlgo,
        _signatureSecret: signatureSecret,
      },
    };
  },
});
