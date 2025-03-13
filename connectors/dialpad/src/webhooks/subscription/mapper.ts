import { EventMapper } from "@runmorph/cdk";
import { createHmac } from "crypto";
import DialpadCallMapper from "../../resources/telephonyCall/mapper";

export default new EventMapper({
  events: {
    telephonyCall: {
      mapper: DialpadCallMapper,
      triggers: ["created", "updated"],
    },
  },
  metadataKeys: [
    "webhookId",
    "subscriptionId",
    "subscriptionType",
    "_signatureAlgo",
    "_signatureSecret",
  ],
  handler: async (request, { model, trigger, metadata }) => {
    // Verify payload with metadata._signatureSecret
    const [headerStr, payloadStr, signature] = (request.body as string).split(
      "."
    );

    if (!metadata._signatureSecret) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
          message: "Missing signature secret in metadata",
        },
      };
    }

    // Verify signature
    const signInput = `${headerStr}.${payloadStr}`;
    const expectedSignature = createHmac("sha256", metadata._signatureSecret)
      .update(signInput)
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    if (signature !== expectedSignature) {
      return {
        error: {
          code: "CONNECTOR::WEBHOOK::VALIDATION_FAILED",
          message: "Invalid webhook signature",
        },
      };
    }

    // Decode payload
    const decodedPayloadStr = Buffer.from(payloadStr, "base64").toString();
    const payload = JSON.parse(decodedPayloadStr);

    return {
      rawResource: payload,
      idempotencyKey: `${payload[`${metadata.subscriptionType}_id`]}-${payload.event_timestamp}`,
    };
  },
});
