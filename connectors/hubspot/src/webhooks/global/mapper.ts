import { EventType, GlobalEventMapper, ResourceEvents } from "@runmorph/cdk";

import HubSpotContactMapper from "../../resources/genericContact/mapper";

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

export default new GlobalEventMapper({
  eventRouter: {
    main: {
      genericContact: ["updated", "created"],
    },
  },
  handler: async (request, globalRoute) => {
    const { body } = request as HubSpotRequest;
    switch (globalRoute) {
      case "main":
        return body.map((event) => {
          const [objectType, eventType] = event.subscriptionType.split(".");

          const trigger = hubspotEventType[eventType as HSEventType];
          const model = hubspotObjectProperties[objectType as HSObjectType];

          console.log("model", model);
          return {
            mapper: HubSpotContactMapper,
            trigger: trigger,
            resourceRef: {
              id: event.objectId.toString(),
            },
            identifierKey: `${event.appId}::${event.portalId}::${globalRoute}::${model}::${trigger}`,
            idempotencyKey: event.eventId.toString(),
          };
        });
    }
  },
});
