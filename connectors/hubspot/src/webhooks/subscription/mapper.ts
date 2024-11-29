import { EventMapper, EventTrigger } from "@runmorph/cdk";

import HubSpotContactMapper from "../../resourceModels/genericContact/mapper";

type HubSpotEvent =
  | "contact.creation"
  | "contact.propertyChange"
  | "contact.deletion";
type HubSpotObjectType = HubSpotEvent extends `${infer T}.${string}`
  ? T
  : never;
type HubSpotEventType = HubSpotEvent extends `${string}.${infer Action}`
  ? Action
  : never;

export type HubSpotWebhookEvent = {
  subscriptionId: string; // Unique identifier for the subscription
  portalId: number; // The HubSpot account ID
  eventId: string; // A unique ID for the event
  eventType: HubSpotEvent; // The type of event, e.g. "contact.creation", "form.submission"
  objectId: string; // The ID of the object that triggered the event (e.g., contact or form ID)
  occurredAt: string; // Timestamp when the event occurred (ISO 8601 format)
  data: unknown; // The data related to the event (generic type to allow different event structures)
};

type HubSpotRequest = {
  body: HubSpotWebhookEvent;
  headers: {
    orgine: string;
  };
};

export const modelToHubSpotObject: Record<string, string> = {
  genericContact: "contact",
};

export const eventToHubSpotEvent: Record<string, string> = {
  created: "create",
  updated: "propertyChange",
  deleted: "delete",
};

const hubspotObjectToMapper = {
  contact: HubSpotContactMapper,
};

const hubspotEventTypeToSupportedType: Record<HubSpotEventType, EventTrigger> =
  {
    creation: "created",
    propertyChange: "updated",
    deletion: "deleted",
  };

export default new EventMapper({
  // Set HubSpot subscription events
  events: {
    genericContact: ["created", "updated", "deleted"],
  },
  handler(request) {
    const { body } = request as HubSpotRequest;

    const [objectType, eventType] = body.eventType.split(".");

    return {
      mapper: hubspotObjectToMapper[objectType as HubSpotObjectType],
      trigger: hubspotEventTypeToSupportedType[eventType as HubSpotEventType],
      rawResource: body.data,
      idempotencyKey: body.eventId,
    };
  },
});
