import { EventMapper } from "@runmorph/cdk";

import AircallCallMapper from "../../resources/telephonyCall/mapper";

type AircallEvent<T = Record<string, any>> = {
  resource: "call";
  event: "call.created" | "call.updated";
  timestamp: number;
  token: string;
  data: unknown;
};

export default new EventMapper({
  events: {
    telephonyCall: {
      mapper: AircallCallMapper,
      triggers: ["updated", "created"],
    },
  },
  metadataKeys: ["webookToken", "webhookId"],
  handler: async (request, { metadata }) => {
    const { body } = request as { body: AircallEvent };
    const { webookToken } = metadata;

    if (!webookToken || body.token !== webookToken) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
          message: "Webhook token missing or does not match",
        },
      };
    }

    if (body.data) {
      return {
        rawResource: body.data,
        idempotencyKey: `${body.resource}-${body.event}-${body.timestamp}}`,
      };
    }
    return {
      error: {
        code: "CONNECTOR::WEBHOOK::MAPPER_FAILED",
        message: "Missing objectId in webhook event",
      },
    };
  },
});
