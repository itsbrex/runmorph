import { GlobalEventMapper } from "@runmorph/cdk";

import HubSpotContactMapper from "../../resources/genericContact/mapper";
import HubSpotCardViewMapper from "../../resources/widgetCardView/mapper";
type HubSpotEventType = "contact.propertyChange";

export type HubSpotWebhookEvent = {
  appId: number; // The HubSpot app ID
  eventId: number; // A unique ID for the event
  subscriptionId: number; // Unique identifier for the subscription
  portalId: number; // The HubSpot account ID
  occurredAt: number; // Timestamp when the event occurred (Unix timestamp)
  subscriptionType: HubSpotEventType; // The type of subscription that triggered this event
  attemptNumber: number; // Number of delivery attempts
  objectId: number; // The ID of the object that triggered the event
  changeSource: string; // Source of the change (e.g. "CRM")
  propertyName?: string; // Name of the property that changed
  propertyValue?: string; // New value of the property
  changeFlag?: string; // Type of change (e.g. "NEW")
};

const hubspotEventType = {
  creation: "created",
  propertyChange: "updated",
  deletion: "deleted",
} as const;

type HSEventType = keyof typeof hubspotEventType;

const hubspotObjectProperties = {
  contact: "genericContact",
  //company: "genericCompany",
  // deal: "crmOpportunity",
} as const;

type HSObjectType = keyof typeof hubspotObjectProperties;

type HubSpotRequest = {
  body: HubSpotWebhookEvent[];
};

type HubSpotCardViewQuery = {
  portalId: string;
  associatedObjectType: string;
  hs_object_id: string;
};

export default new GlobalEventMapper({
  eventRoutes: {
    main: {
      genericContact: {
        mapper: HubSpotContactMapper,
        triggers: ["updated", "created", "deleted"],
      },
    },
    cardView: {
      widgetCardView: {
        mapper: HubSpotCardViewMapper,
        triggers: ["created"],
      },
    },
  },
  identifier: async (request, { route }) => {
    switch (route) {
      case "main": {
        const { body } = request as HubSpotRequest;
        return body.map((hubspotEvent) => {
          const [objectType, eventType] =
            hubspotEvent.subscriptionType.split(".");

          const trigger = hubspotEventType[eventType as HSEventType];
          const model = hubspotObjectProperties[objectType as HSObjectType];

          return {
            model,
            trigger,
            identifierKey: hubspotEvent.portalId.toString(),
            request: { ...request, ...{ body: hubspotEvent } },
          };
        });
      }
      case "cardView": {
        const query = request.query as unknown as HubSpotCardViewQuery;

        return [
          {
            model: "widgetCardView",
            trigger: "created",
            rawResource: query,
            identifierKey: query.portalId.toString(),
          },
        ];
      }
      default:
        return {
          error: {
            code: "CONNECTOR::WEBHOOK::MAPPER_FAILED",
            message: `Invalid route: ${route}`,
          },
        };
    }
  },
  handler: async (request, { model, trigger, metadata }) => {
    if (model === "widgetCardView") {
      const query = request.query as unknown as HubSpotCardViewQuery;
      return {
        rawResource: query,
        identifierKey: query.portalId.toString(),
        idempotencyKey: `${query.portalId}-${query.associatedObjectType}-${query.hs_object_id}-${Date.now()}`,
      };
    } else {
      const { body } = request as { body: HubSpotWebhookEvent };
      if (!body.objectId) {
        return {
          error: {
            code: "CONNECTOR::WEBHOOK::MAPPER_FAILED",
            message: "Missing objectId in webhook event",
          },
        };
      }
      return {
        resourceRef: {
          id: body.objectId.toString(),
        },
        idempotencyKey: body.eventId.toString(),
      };
    }
  },
});
