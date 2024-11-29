import { GlobalEventMapper } from "@runmorph/cdk";

import HubSpotOpportuntyMapper from "@/resourceModels/crmOpportunity/mapper";
import HubSpotContactMapper from "@/resourceModels/genericContact/mapper";

type HubSpotEventType = "contact.creation" | "deal.creation";

export type HubSpotWebhookEvent = {
  subscriptionId: string; // Unique identifier for the subscription
  portalId: number; // The HubSpot account ID
  eventId: string; // A unique ID for the event
  eventType: HubSpotEventType; // The type of event, e.g. "contact.creation", "form.submission"
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

export default new GlobalEventMapper({
  eventRouter: {
    cardViewRequest: {
      crmOpportunity: ["created"],
    },
    gdprContactDeletionRequest: {
      genericContact: ["deleted"],
    },
  },
  handler(request, globalRoute) {
    const { body } = request as HubSpotRequest;
    switch (globalRoute) {
      case "cardViewRequest":
        return {
          mapper: HubSpotOpportuntyMapper,
          trigger: "created",
          rawResource: body.data,
          identifierKey: `${body.portalId}::${globalRoute}::${"crmCardView"}::${"created"}`,
          idempotencyKey: body.eventId,
        };
      case "gdprContactDeletionRequest":
        return {
          mapper: HubSpotContactMapper,
          trigger: "deleted",
          rawResource: body.data,
          identifierKey: `${body.portalId}::${globalRoute}::${"genericContact"}::${"deleted"}`,
          idempotencyKey: body.eventId,
        };
    }
  },
});
