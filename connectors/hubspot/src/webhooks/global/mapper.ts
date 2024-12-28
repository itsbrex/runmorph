import { GlobalEventMapper } from "@runmorph/cdk";

import HubSpotContactMapper from "../../resources/genericContact/mapper";
import HubSpotCardViewMapper from "../../resources/widgetCardViewRequest/mapper";
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
  company: "genericCompany",
  deal: "crmOpportunity",
};

type HSObjectType = keyof typeof hubspotObjectProperties;

type HubSpotRequest = {
  body: HubSpotWebhookEvent[];
};

type HubSpotCardViewQuery = {
  portalId?: string;
  associatedObjectType?: string;
  hs_object_id?: string;
};

export default new GlobalEventMapper({
  eventRouter: {
    main: {
      genericContact: ["updated", "created"],
    },
    cardView: {
      widgetCardViewRequest: ["created"],
    },
  },
  handler: async (request, globalRoute) => {
    switch (globalRoute) {
      case "main": {
        const { body } = request as HubSpotRequest;
        return body.map((hubspotEvent) => {
          const [objectType, eventType] =
            hubspotEvent.subscriptionType.split(".");

          const trigger = hubspotEventType[eventType as HSEventType];
          const model = hubspotObjectProperties[objectType as HSObjectType];

          return {
            mapper: HubSpotContactMapper,
            trigger: trigger,
            resourceRef: {
              id: hubspotEvent.objectId.toString(),
            },
            identifierKey: `${hubspotEvent.portalId}-${globalRoute}-${model}-${trigger}`,
            idempotencyKey: hubspotEvent.eventId.toString(),
          };
        });
      }
      case "cardView": {
        const { query } = request as { query: HubSpotCardViewQuery };
        return [
          {
            mapper: HubSpotCardViewMapper,
            trigger: "created",
            rawResource: query,
            identifierKey: `${query.portalId}-${globalRoute}-widgetCardViewRequest-created`,
            idempotencyKey: `${query.portalId}-${globalRoute}-${query.associatedObjectType}-${query.hs_object_id}-${Date.now()}`,
          },
        ];
      }
    }
  },
});
